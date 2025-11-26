# OGraf Template Editor

A web-based graphics template editor for broadcast based on the EBU OGraf standard. Create professional broadcast graphics without needing to be a graphic designer.

## Features

- **Visual Editor**: Drag-and-drop interface for creating graphics elements
- **Template Types**: Pre-built templates for lower thirds, title cards, station bugs, and custom graphics
- **Real-time Preview**: See your graphics in action with live preview functionality
- **Code Editor**: Advanced editing with manifest and component code access
- **OGraf Compliance**: Fully compatible with EBU OGraf v1 specification
- **Export/Import**: Save and share templates in OGraf-compatible formats
- **Browser-based**: No installation required - runs entirely in your web browser

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Usage

### Creating Your First Template

1. Click "Create Your First Template" or "New Template"
2. Choose a template type:
   - **Lower Third**: Name and title overlays
   - **Title**: Full-screen title cards
   - **Bug**: Small station logos/branding
   - **Custom**: Start from scratch

3. Fill in the template details and click "Create"

### Visual Editor

- **Add Elements**: Use the toolbar to add text, images, rectangles, or circles
- **Move Elements**: Click and drag elements to reposition them
- **Resize Elements**: Select an element and drag the corner handles
- **Delete Elements**: Select an element and press Delete key

### Property Panel

- **Element Properties**: Modify position, size, and content of selected elements
- **Style Properties**: Change colors, fonts, borders, and other visual styles
- **Template Properties**: Configure data inputs for your template

### Preview

- **Data Inputs**: Enter sample data to see how your template will look
- **Play/Stop**: Test template animations and transitions
- **Update**: Refresh preview with new data

### Code Editor

- **Manifest Tab**: Edit the OGraf manifest JSON directly
- **Component Tab**: Modify the Web Component implementation
- **Validation**: Real-time validation of your code

### Export/Import

- **Export**: Save templates as OGraf-compatible files
- **Import**: Load existing OGraf templates
- **Formats**: Support for JSON and OGraf bundle formats

## OGraf Specification

This editor implements the EBU OGraf v1 specification for HTML-based broadcast graphics. Templates created with this editor are compatible with OGraf-compliant rendering systems.

### Template Structure

Each template consists of:
- **Manifest** (`.ograf.json`): Metadata and schema definition
- **Web Component** (`.mjs`): HTML/CSS/JavaScript implementation

### Required Methods

All OGraf templates implement these methods:
- `load()`: Initialize the graphic
- `dispose()`: Clean up resources
- `playAction()`: Show/animate the graphic
- `stopAction()`: Hide the graphic
- `updateAction(data)`: Update with new data
- `customAction(action, data)`: Handle custom actions

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Project Structure

```
src/
├── components/          # UI components
│   ├── VisualEditor.js   # Drag-and-drop editor
│   ├── PropertyPanel.js  # Element properties
│   ├── PreviewEngine.js  # Template preview
│   └── CodeEditor.js     # Code editing
├── models/              # Data models
│   └── OGrafTemplate.js  # Template structure
├── services/            # Business logic
│   ├── TemplateManager.js      # Template CRUD
│   └── ExportImportService.js  # File operations
├── styles/              # CSS styles
│   ├── main.css         # Base styles
│   └── components.css   # Component styles
└── main.js              # Application entry point
```

### Build Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript checks
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Resources

- [EBU OGraf Specification](https://ograf.ebu.io/)
- [OGraf GitHub Repository](https://github.com/ebu/ograf)
- [EBU Technology & Innovation](https://tech.ebu.ch/)

## Support

For issues and questions:
- Check the documentation at [ograf.ebu.io](https://ograf.ebu.io/)
- Review existing issues in the repository
- Create a new issue with detailed information

---

Built with ❤️ for the broadcast community