export class PreviewEngine {
    constructor(containerElement, templateManager) {
        this.container = containerElement;
        this.templateManager = templateManager;
        this.previewFrame = null;
        this.currentTemplate = null;
        this.previewData = {};
        this.isPlaying = false;
        
        this.init();
    }

    init() {
        // Check for modern browser support
        if (!this.checkBrowserCompatibility()) {
            this.showBrowserCompatibilityError();
            return;
        }
        
        this.setupPreviewFrame();
        this.setupEventListeners();
        this.render();
    }

    checkBrowserCompatibility() {
        // Check for Custom Elements support
        if (!window.customElements) {
            return false;
        }
        
        // Check for Shadow DOM support
        if (!Element.prototype.attachShadow) {
            return false;
        }
        
        // Check for ES6 features we use
        try {
            new Function('class Test {}')();
            new Function('const test = () => {}')();
        } catch (e) {
            return false;
        }
        
        return true;
    }

    showBrowserCompatibilityError() {
        const previewContainer = this.container.querySelector('.preview-frame');
        if (!previewContainer) return;

        previewContainer.innerHTML = `
            <div class="browser-error">
                <h3>❌ Browser Not Supported</h3>
                <p>This preview requires a modern web browser with support for:</p>
                <ul>
                    <li>Custom Elements (Web Components)</li>
                    <li>Shadow DOM</li>
                    <li>ES6 Classes and Arrow Functions</li>
                </ul>
                <p>Please update to a recent version of Chrome, Firefox, Safari, or Edge.</p>
            </div>
        `;
    }

    setupPreviewFrame() {
        const previewContainer = this.container.querySelector('.preview-frame');
        if (!previewContainer) return;

        // Create preview div instead of iframe to avoid security issues
        this.previewFrame = document.createElement('div');
        this.previewFrame.className = 'preview-container-div';
        this.previewFrame.style.width = '100%';
        this.previewFrame.style.height = '100%';
        this.previewFrame.style.backgroundColor = '#000000';
        this.previewFrame.style.position = 'relative';
        this.previewFrame.style.overflow = 'hidden';
        
        previewContainer.innerHTML = '';
        previewContainer.appendChild(this.previewFrame);
    }

    setupEventListeners() {
        // Preview control buttons
        const playBtn = this.container.querySelector('#play-preview');
        const stopBtn = this.container.querySelector('#stop-preview');
        const updateBtn = this.container.querySelector('#update-preview');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.update());
        }
    }

    render() {
        try {
            const template = this.templateManager.getCurrentTemplate();
            if (!template) {
                this.renderEmptyState();
                return;
            }

            this.currentTemplate = template;
            this.renderDataInputs();
            
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
                this.setupPreviewDocument();
            }, 50);
            
        } catch (error) {
            this.showPreviewError('Failed to render preview');
        }
    }

    renderEmptyState() {
        const previewContainer = this.container.querySelector('.preview-frame');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <p>Select a template to preview</p>
                </div>
            `;
        }
    }

    renderDataInputs() {
        const controlsContainer = this.container.querySelector('.preview-controls');
        if (!controlsContainer || !this.currentTemplate) return;

        // Create data inputs container if it doesn't exist
        let dataInputsContainer = this.container.querySelector('.preview-data-inputs');
        if (!dataInputsContainer) {
            dataInputsContainer = document.createElement('div');
            dataInputsContainer.className = 'preview-data-inputs';
            controlsContainer.insertAdjacentElement('afterend', dataInputsContainer);
        }

        const schema = this.currentTemplate.manifest.schema;
        if (!schema || !schema.properties) {
            dataInputsContainer.innerHTML = '<p>No data inputs available</p>';
            return;
        }

        // Initialize preview data with default values
        Object.entries(schema.properties).forEach(([key, prop]) => {
            if (this.previewData[key] === undefined) {
                this.previewData[key] = prop.default || '';
            }
        });


        const inputsHtml = Object.entries(schema.properties).map(([key, prop]) => {
            const currentValue = this.previewData[key] || prop.default || '';
            return `
                <div class="data-input-group">
                    <label>${prop.title || key}:</label>
                    <input 
                        type="text" 
                        class="data-input" 
                        data-property="${key}" 
                        value="${currentValue}"
                        placeholder="${prop.default || ''}"
                    >
                </div>
            `;
        }).join('');

        dataInputsContainer.innerHTML = inputsHtml;

        // Setup event listeners for data inputs
        dataInputsContainer.querySelectorAll('.data-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.previewData[e.target.dataset.property] = e.target.value;
                this.updatePreviewData();
            });
        });
    }

    setupPreviewDocument() {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            // Clear previous content first
            this.previewFrame.innerHTML = '';
            
            // Create a scaled container for the graphics
            const scaledContainer = document.createElement('div');
            scaledContainer.style.width = '1920px';
            scaledContainer.style.height = '1080px';
            scaledContainer.style.transform = 'scale(0.5)';
            scaledContainer.style.transformOrigin = 'top left';
            scaledContainer.style.position = 'absolute';
            scaledContainer.style.top = '0';
            scaledContainer.style.left = '0';
            scaledContainer.style.backgroundColor = '#000000';
            scaledContainer.style.border = '1px solid #333333';
            

            // Always regenerate the web component to ensure latest styles
            if (typeof this.currentTemplate.generateWebComponent === 'function') {
                if (typeof this.currentTemplate.generateElementStyles === 'function') {
                    this.currentTemplate.generateWebComponent();
                } else {
                    this.generateBasicWebComponent();
                }
            } else {
                this.showWebComponentError('Template does not support web components', 
                    new Error('generateWebComponent method not available'));
                return;
            }
            
            // Add to preview frame immediately (empty black container)
            this.previewFrame.appendChild(scaledContainer);
            
            // Store container reference for later use during play
            this.scaledContainer = scaledContainer;
            
            // Reset content creation flag
            this.previewContentCreated = false;
            
            // Don't create content yet - wait for play button
            
        } catch (error) {
            this.showPreviewError('Failed to load preview');
        }
    }

    createPreviewComponent(container) {
        const template = this.currentTemplate;
        const componentId = template.manifest.id;
        
        // Define the custom element class if not already defined
        if (!customElements.get(`${componentId}-graphic`)) {
            try {
                // Execute the component code to register the custom element
                const componentCode = template.webComponent;
                
                if (!componentCode) {
                    template.generateWebComponent();
                }
                
                // Convert ES6 module syntax to browser-compatible code
                const browserCode = this.convertModuleCodeForBrowser(componentCode, componentId);
                
                // Create and execute a script element for module code
                const script = document.createElement('script');
                script.textContent = browserCode;
                document.head.appendChild(script);
                
            } catch (error) {
                this.showWebComponentError('Failed to register custom element', error);
                return;
            }
        }
        
        // Create custom element HTML
        const customElement = document.createElement(`${componentId}-graphic`);
        customElement.id = 'graphic-component';
        customElement.style.position = 'absolute';
        customElement.style.top = '0';
        customElement.style.left = '0';
        customElement.style.width = '100%';
        customElement.style.height = '100%';
        customElement.style.zIndex = '10';
        
        // Add component to container
        container.appendChild(customElement);
        
        
        // Store reference for later use
        this.currentComponent = customElement;
    }

    convertModuleCodeForBrowser(componentCode, componentId) {
        // Clean up any old export statements that might still exist
        let cleanCode = componentCode;
        
        // Remove export default if it exists
        cleanCode = cleanCode.replace(/^export\s+default\s+/m, '');
        
        // Ensure we have proper class definition
        if (!cleanCode.includes('customElements.define')) {
            // Extract class name
            const classMatch = cleanCode.match(/class\s+(\w+)\s+extends\s+HTMLElement/);
            const className = classMatch ? classMatch[1] : `${componentId.charAt(0).toUpperCase() + componentId.slice(1)}Graphic`;
            
            // Add custom element definition if missing
            cleanCode += `\ncustomElements.define('${componentId}-graphic', ${className});`;
        }
        
        // Wrap in IIFE for isolation
        const browserCode = `
        (function() {
            ${cleanCode}
        })();
        `;
        
        return browserCode;
    }

    generateBasicWebComponent() {
        const template = this.currentTemplate;
        const componentId = template.manifest.id;
        
        // Generate element styles manually
        const elements = template.elements || [];
        const elementStyles = elements.map(element => {
            const styles = Object.entries(element.style || {})
                .map(([key, value]) => `${this.kebabCase(key)}: ${value};`)
                .join(' ');
            return `.element-${element.id} { ${styles} }`;
        }).join('\n');
        
        // Serialize elements data
        const elementsData = JSON.stringify(elements);
        
        const componentCode = `
class ${this.toCamelCase(componentId)}Graphic extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.data = {};
        this.isVisible = false;
        this.elements = ${elementsData};
    }

    connectedCallback() {
        this.render();
    }

    async load() {
        this.isVisible = false;
        this.render();
        return Promise.resolve();
    }

    async dispose() {
        this.isVisible = false;
        this.shadowRoot.innerHTML = '';
        return Promise.resolve();
    }

    async playAction() {
        this.isVisible = true;
        this.render();
        return Promise.resolve();
    }

    async stopAction() {
        this.isVisible = false;
        this.render();
        return Promise.resolve();
    }

    async updateAction(data) {
        this.data = { ...this.data, ...data };
        this.render();
        return Promise.resolve();
    }

    async customAction(action, data) {
        return Promise.resolve();
    }

    render() {
        const style = \`
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 1920px;
                    height: 1080px;
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                }
                .element {
                    position: absolute;
                    transition: opacity 0.3s ease;
                    opacity: \${this.isVisible ? '1' : '0'};
                }
                ${elementStyles}
            </style>
        \`;

        const elements = this.elements.map(element => this.renderElement(element)).join('');

        this.shadowRoot.innerHTML = \`
            \${style}
            <div class="container">
                \${elements}
            </div>
        \`;
    }

    renderElement(element) {
        const content = this.interpolateContent(element.content || '');
        
        switch (element.type) {
            case 'text':
                return \`<div class="element element-\${element.id}" style="left: \${element.x}px; top: \${element.y}px; width: \${element.width}px; height: \${element.height}px;">\${content}</div>\`;
            case 'image':
                return \`<img class="element element-\${element.id}" src="\${content}" style="left: \${element.x}px; top: \${element.y}px; width: \${element.width}px; height: \${element.height}px;" />\`;
            case 'rectangle':
                return \`<div class="element element-\${element.id}" style="left: \${element.x}px; top: \${element.y}px; width: \${element.width}px; height: \${element.height}px;"></div>\`;
            case 'circle':
                return \`<div class="element element-\${element.id}" style="left: \${element.x}px; top: \${element.y}px; width: \${element.width}px; height: \${element.height}px; border-radius: 50%;"></div>\`;
            default:
                return '';
        }
    }

    interpolateContent(content) {
        return content.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {
            return this.data[key] || match;
        });
    }

    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
}

customElements.define('${componentId}-graphic', ${this.toCamelCase(componentId)}Graphic);
        `;

        // Store the generated component
        template.webComponent = componentCode.trim();
    }

    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
                 .replace(/^[a-z]/, (g) => g.toUpperCase());
    }

    kebabCase(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }


    interpolateContent(content) {
        const result = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = this.previewData[key] || match;
            return value;
        });
        return result;
    }

    showPreviewError(message) {
        const previewContainer = this.container.querySelector('.preview-frame');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <p style="color: #ff6b6b;">⚠️ ${message}</p>
                    <button id="retry-preview-btn" style="margin-top: 10px; padding: 5px 10px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer;">Retry</button>
                </div>
            `;
            
            // Setup retry button event listener
            const retryBtn = previewContainer.querySelector('#retry-preview-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.render();
                });
            }
        }
    }


    initializePreviewComponent() {
        // Initialize component if it exists
        if (this.currentComponent) {
            try {
                
                // Try to call load method if available
                if (typeof this.currentComponent.load === 'function') {
                    this.currentComponent.load().then(() => {
                        // Initialize as NOT visible - elements should only show when Play is pressed
                        this.currentComponent.isVisible = false;
                        // Small delay to ensure component is loaded
                        setTimeout(() => {
                            this.updatePreviewData();
                        }, 50);
                    }).catch((error) => {
                        this.currentComponent.isVisible = false;
                        this.updatePreviewData();
                    });
                } else {
                    // No load method, initialize as NOT visible
                    this.currentComponent.isVisible = false;
                    setTimeout(() => {
                        this.updatePreviewData();
                    }, 50);
                }
            } catch (error) {
                this.showWebComponentError('Failed to initialize preview component', error);
            }
        } else {
            this.showWebComponentError('No preview component found', 
                new Error('currentComponent is not available'));
        }
    }

    createPreviewContent() {
        if (!this.scaledContainer || !this.currentTemplate) return;

        try {
            // Only create web component (no fallback)
            this.createPreviewComponent(this.scaledContainer);
            
            // Initialize component
            setTimeout(() => {
                this.initializePreviewComponent();
            }, 100);
            
        } catch (error) {
            this.showWebComponentError('Failed to create web component preview', error);
        }
    }

    showWebComponentError(message, error) {
        this.scaledContainer.innerHTML = `
            <div class="web-component-error">
                <h3>⚠️ Web Component Error</h3>
                <p>${message}</p>
                <details>
                    <summary>Error Details</summary>
                    <pre>${error?.message || 'Unknown error'}</pre>
                    ${error?.stack ? `<pre>${error.stack}</pre>` : ''}
                </details>
                <p>Please check your template code generation or try regenerating the template.</p>
            </div>
        `;
    }

    async play() {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            // First time playing - create the preview content
            if (!this.previewContentCreated) {
                this.createPreviewContent();
                this.previewContentCreated = true;
            }

            if (this.currentComponent && typeof this.currentComponent.playAction === 'function') {
                await this.currentComponent.playAction();
                this.isPlaying = true;
                this.updateControlButtons();
            } else {
                this.showWebComponentError('Web component not properly initialized', 
                    new Error('playAction method not available on component'));
            }
        } catch (error) {
            this.showWebComponentError('Failed to play preview', error);
        }
    }

    async stop() {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            // Set playing state to false first
            this.isPlaying = false;
            this.updateControlButtons();

            if (this.currentComponent && typeof this.currentComponent.stopAction === 'function') {
                await this.currentComponent.stopAction();
            } else {
                this.showWebComponentError('Web component not properly initialized', 
                    new Error('stopAction method not available on component'));
            }
            
        } catch (error) {
            this.showWebComponentError('Failed to stop preview', error);
        }
    }

    async update() {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            if (this.currentComponent && typeof this.currentComponent.updateAction === 'function') {
                await this.currentComponent.updateAction(this.previewData);
            } else {
                this.showWebComponentError('Web component not properly initialized', 
                    new Error('updateAction method not available on component'));
            }
        } catch (error) {
            this.showWebComponentError('Failed to update preview', error);
        }
    }

    async updatePreviewData() {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            // Update the custom component
            if (this.currentComponent && typeof this.currentComponent.updateAction === 'function') {
                await this.currentComponent.updateAction(this.previewData);
            }
            
        } catch (error) {
            this.showWebComponentError('Failed to update preview data', error);
        }
    }

    reloadComponent() {
        if (!this.currentTemplate) return;
        
        // Update existing component's animation settings if it exists
        if (this.currentComponent && this.currentTemplate.animationSettings) {
            this.currentComponent.animationSettings = { ...this.currentTemplate.animationSettings };
            return;
        }
        
        // If no existing component or currently playing, recreate
        if (this.isPlaying) {
            // Reset the component creation flag to force recreation
            this.previewContentCreated = false;
            
            // Clear the current component
            if (this.scaledContainer) {
                this.scaledContainer.innerHTML = '';
            }
            this.currentComponent = null;
            
            // Recreate and resume playing
            this.createPreviewContent();
            this.previewContentCreated = true;
            
            // Small delay to ensure component is ready
            setTimeout(() => {
                if (this.currentComponent) {
                    this.currentComponent.playAction();
                }
            }, 100);
        } else {
            // Just mark that component needs to be recreated on next play
            this.previewContentCreated = false;
            
            // Clear any existing component
            if (this.scaledContainer) {
                this.scaledContainer.innerHTML = '';
            }
            this.currentComponent = null;
        }
    }


    updateControlButtons() {
        const playBtn = this.container.querySelector('#play-preview');
        const stopBtn = this.container.querySelector('#stop-preview');

        if (playBtn) {
            playBtn.disabled = this.isPlaying;
            playBtn.textContent = this.isPlaying ? 'Playing...' : 'Play';
        }

        if (stopBtn) {
            stopBtn.disabled = !this.isPlaying;
        }
    }

    refreshPreview() {
        this.render();
    }

    // Method to handle custom actions
    async executeCustomAction(actionName, data = {}) {
        if (!this.previewFrame || !this.currentTemplate) return;

        try {
            if (this.currentComponent && typeof this.currentComponent.customAction === 'function') {
                await this.currentComponent.customAction(actionName, data);
            }
        } catch (error) {
            // Error executing custom action
        }
    }

    // Method to get current preview state
    getPreviewState() {
        return {
            isPlaying: this.isPlaying,
            data: this.previewData,
            template: this.currentTemplate ? this.currentTemplate.manifest.id : null
        };
    }

    // Method to set preview data programmatically
    setPreviewData(data) {
        this.previewData = { ...this.previewData, ...data };
        
        // Update input fields
        const dataInputsContainer = this.container.querySelector('.preview-data-inputs');
        if (dataInputsContainer) {
            Object.entries(data).forEach(([key, value]) => {
                const input = dataInputsContainer.querySelector(`[data-property="${key}"]`);
                if (input) {
                    input.value = value;
                }
            });
        }
        
        this.updatePreviewData();
    }

    // Method to clear preview data
    clearPreviewData() {
        this.previewData = {};
        this.renderDataInputs();
        this.updatePreviewData();
    }

    // Method to export preview as image (basic implementation)
    async exportPreviewImage() {
        if (!this.previewFrame) return null;

        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            
            const ctx = canvas.getContext('2d');
            
            // This is a simplified approach - in a real implementation,
            // you might use libraries like html2canvas or puppeteer for better rendering
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add text indicating this is a preview export
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OGraf Preview Export', canvas.width / 2, canvas.height / 2);
            
            if (this.currentTemplate) {
                ctx.font = '24px Arial';
                ctx.fillText(this.currentTemplate.manifest.name, canvas.width / 2, canvas.height / 2 + 60);
            }
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            return null;
        }
    }

    destroy() {
        // Clean up event listeners and iframe
        if (this.previewFrame) {
            this.previewFrame.remove();
        }
    }
}