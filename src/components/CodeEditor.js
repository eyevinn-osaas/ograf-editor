export class CodeEditor {
    constructor(containerElement, templateManager) {
        this.container = containerElement;
        this.templateManager = templateManager;
        this.monaco = null;
        this.manifestEditor = null;
        this.componentEditor = null;
        this.currentTab = 'manifest';
        
        this.init();
    }

    async init() {
        this.setupTabs();
        await this.initializeMonaco();
        this.render();
    }

    setupTabs() {
        const codeEditorDiv = this.container.querySelector('#code-editor');
        if (!codeEditorDiv) return;

        // Create tabs if they don't exist
        let tabsContainer = codeEditorDiv.querySelector('.code-editor-tabs');
        if (!tabsContainer) {
            tabsContainer = document.createElement('div');
            tabsContainer.className = 'code-editor-tabs';
            tabsContainer.innerHTML = `
                <button class="code-tab-btn active" data-tab="manifest">Manifest</button>
                <button class="code-tab-btn" data-tab="component">Component</button>
            `;
            codeEditorDiv.insertBefore(tabsContainer, codeEditorDiv.firstChild);
        }

        // Create content container
        let contentContainer = codeEditorDiv.querySelector('.code-content');
        if (!contentContainer) {
            contentContainer = document.createElement('div');
            contentContainer.className = 'code-content';
            contentContainer.innerHTML = `
                <div class="code-tab-content active" data-tab="manifest">
                    <div id="manifest-editor"></div>
                </div>
                <div class="code-tab-content" data-tab="component">
                    <div id="component-editor"></div>
                </div>
            `;
            codeEditorDiv.appendChild(contentContainer);
        }

        // Setup tab event listeners
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('code-tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
    }

    async initializeMonaco() {
        try {
            // For this implementation, we'll use a simple textarea fallback
            // In a production environment, you would load Monaco Editor properly
            this.setupSimpleEditor();
        } catch (error) {
            this.setupSimpleEditor();
        }
    }

    setupSimpleEditor() {
        // Simple textarea-based editor as fallback
        const manifestContainer = this.container.querySelector('#manifest-editor');
        const componentContainer = this.container.querySelector('#component-editor');

        if (manifestContainer) {
            manifestContainer.innerHTML = `
                <textarea class="simple-code-editor" id="manifest-textarea" placeholder="Template manifest JSON will appear here..."></textarea>
            `;
            this.manifestEditor = manifestContainer.querySelector('textarea');
            this.manifestEditor.addEventListener('input', () => this.onManifestChange());
        }

        if (componentContainer) {
            componentContainer.innerHTML = `
                <textarea class="simple-code-editor" id="component-textarea" placeholder="Web component code will appear here..."></textarea>
            `;
            this.componentEditor = componentContainer.querySelector('textarea');
            this.componentEditor.addEventListener('input', () => this.onComponentChange());
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        this.container.querySelectorAll('.code-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        this.container.querySelectorAll('.code-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });

        // Update editor content
        this.updateEditorContent();
    }

    render() {
        this.updateEditorContent();
    }

    updateEditorContent() {
        const template = this.templateManager.getCurrentTemplate();
        if (!template) {
            this.clearEditors();
            return;
        }

        if (this.currentTab === 'manifest') {
            this.updateManifestEditor(template);
        } else if (this.currentTab === 'component') {
            this.updateComponentEditor(template);
        }
    }

    updateManifestEditor(template) {
        if (this.manifestEditor) {
            const manifestJson = JSON.stringify(template.manifest, null, 2);
            this.manifestEditor.value = manifestJson;
        }
    }

    updateComponentEditor(template) {
        if (this.componentEditor) {
            // Generate component if not exists
            if (!template.webComponent) {
                template.generateWebComponent();
            }
            this.componentEditor.value = template.webComponent || '// Component code will be generated here';
        }
    }

    clearEditors() {
        if (this.manifestEditor) {
            this.manifestEditor.value = '// Select a template to view its manifest';
        }
        if (this.componentEditor) {
            this.componentEditor.value = '// Select a template to view its component code';
        }
    }

    onManifestChange() {
        if (!this.manifestEditor) return;

        try {
            const manifestJson = this.manifestEditor.value;
            const manifest = JSON.parse(manifestJson);
            
            const template = this.templateManager.getCurrentTemplate();
            if (template) {
                template.manifest = manifest;
                this.templateManager.saveToStorage();
                this.showValidationMessage('Manifest updated successfully', 'success');
            }
        } catch (error) {
            this.showValidationMessage(`Invalid JSON: ${error.message}`, 'error');
        }
    }

    onComponentChange() {
        if (!this.componentEditor) return;

        const template = this.templateManager.getCurrentTemplate();
        if (template) {
            template.webComponent = this.componentEditor.value;
            this.templateManager.saveToStorage();
            this.showValidationMessage('Component code updated', 'success');
        }
    }

    showValidationMessage(message, type) {
        // Remove existing messages
        const existingMessage = this.container.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `validation-message ${type}-message`;
        messageDiv.textContent = message;
        
        // Insert message
        const activeTab = this.container.querySelector('.code-tab-content.active');
        if (activeTab) {
            activeTab.insertBefore(messageDiv, activeTab.firstChild);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
    }

    formatCode() {
        if (this.currentTab === 'manifest' && this.manifestEditor) {
            try {
                const manifest = JSON.parse(this.manifestEditor.value);
                this.manifestEditor.value = JSON.stringify(manifest, null, 2);
                this.showValidationMessage('Code formatted', 'success');
            } catch (error) {
                this.showValidationMessage('Cannot format invalid JSON', 'error');
            }
        }
    }

    validateCode() {
        const template = this.templateManager.getCurrentTemplate();
        if (!template) return;

        let errors = [];

        // Validate manifest
        if (this.currentTab === 'manifest' && this.manifestEditor) {
            try {
                const manifest = JSON.parse(this.manifestEditor.value);
                
                // Basic validation
                if (!manifest.id) errors.push('Missing id');
                if (!manifest.name) errors.push('Missing name');
                if (!manifest.main) errors.push('Missing main');
                if (typeof manifest.supportsRealTime !== 'boolean') errors.push('supportsRealTime must be boolean');
                if (typeof manifest.supportsNonRealTime !== 'boolean') errors.push('supportsNonRealTime must be boolean');
                
            } catch (error) {
                errors.push(`Invalid JSON: ${error.message}`);
            }
        }

        // Validate component
        if (this.currentTab === 'component' && this.componentEditor) {
            const component = this.componentEditor.value;
            
            if (!component.includes('HTMLElement')) {
                errors.push('Component must extend HTMLElement');
            }
            
            const requiredMethods = ['load', 'dispose', 'playAction', 'stopAction', 'updateAction'];
            for (const method of requiredMethods) {
                if (!component.includes(method)) {
                    errors.push(`Missing required method: ${method}`);
                }
            }
        }

        // Show validation results
        if (errors.length === 0) {
            this.showValidationMessage('Code is valid', 'success');
        } else {
            this.showValidationMessage(`Validation errors: ${errors.join(', ')}`, 'error');
        }

        return errors.length === 0;
    }

    insertSnippet(snippetName) {
        const snippets = {
            'basic-element': `{
    "id": "element_${Date.now()}",
    "type": "text",
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 50,
    "content": "New Element",
    "style": {
        "fontSize": "20px",
        "color": "#ffffff"
    }
}`,
            'schema-property': `"newProperty": {
    "type": "string",
    "title": "New Property",
    "default": "Default Value"
}`,
            'component-method': `async customAction(action, data) {
    switch (action) {
        case 'fadeIn':
            // Implement fade in animation
            break;
        case 'slideUp':
            // Implement slide up animation
            break;
        default:
    }
    return Promise.resolve();
}`
        };

        const snippet = snippets[snippetName];
        if (!snippet) return;

        const activeEditor = this.currentTab === 'manifest' ? this.manifestEditor : this.componentEditor;
        if (activeEditor) {
            const cursorPos = activeEditor.selectionStart;
            const textBefore = activeEditor.value.substring(0, cursorPos);
            const textAfter = activeEditor.value.substring(activeEditor.selectionEnd);
            
            activeEditor.value = textBefore + snippet + textAfter;
            activeEditor.selectionStart = activeEditor.selectionEnd = cursorPos + snippet.length;
            activeEditor.focus();
        }
    }

    exportCode() {
        const template = this.templateManager.getCurrentTemplate();
        if (!template) return;

        let content = '';
        let filename = '';

        if (this.currentTab === 'manifest') {
            content = JSON.stringify(template.manifest, null, 2);
            filename = `${template.manifest.id}.ograf.json`;
        } else if (this.currentTab === 'component') {
            content = template.webComponent || '';
            filename = template.manifest.main || `${template.manifest.id}.mjs`;
        }

        if (content) {
            const blob = new Blob([content], { 
                type: this.currentTab === 'manifest' ? 'application/json' : 'text/javascript' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    getCurrentTabContent() {
        const activeEditor = this.currentTab === 'manifest' ? this.manifestEditor : this.componentEditor;
        return activeEditor ? activeEditor.value : '';
    }

    setCurrentTabContent(content) {
        const activeEditor = this.currentTab === 'manifest' ? this.manifestEditor : this.componentEditor;
        if (activeEditor) {
            activeEditor.value = content;
            
            // Trigger change event
            if (this.currentTab === 'manifest') {
                this.onManifestChange();
            } else {
                this.onComponentChange();
            }
        }
    }

    destroy() {
        // Clean up editors if using Monaco
        if (this.manifestEditor && this.manifestEditor.dispose) {
            this.manifestEditor.dispose();
        }
        if (this.componentEditor && this.componentEditor.dispose) {
            this.componentEditor.dispose();
        }
    }
}