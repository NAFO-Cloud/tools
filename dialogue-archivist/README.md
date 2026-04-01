# Dialogue Archivist

**Structural Decomposition for AI Dialogue Workflows**

A comprehensive tool for processing, standardizing, and improving AI dialogue workflows. Dialogue Archivist identifies missing labels, establishes metadata structures, and transforms raw dialogue into organized, analyzable content.

## Project Overview

### Vision
Enable NAFO Cloud and AI development teams to systematically capture, label, and improve dialogue workflows by creating a bridge between raw conversational data and structured, analyzed content.

### Core Purpose
- **Standardize**: Transform chaotic dialogue into organized structure
- **Label**: Automatically identify speakers, roles, and content types
- **Analyze**: Extract psychological and structural insights
- **Improve**: Build learning database for workflow optimization

## Project Structure

```
dialogue-archivist/
├── ui/                          # Web interface
│   ├── index.html              # Main HTML structure
│   ├── style.css               # Styling (Structural Entropy design)
│   ├── app.js                  # Frontend logic
│   └── README.md               # UI documentation
├── example-database/            # Workflow examples
│   ├── input-01.md             # Raw dialogue input
│   └── output-01.md            # Processed output
├── dialogue_archivist.py       # Backend logic
└── README.md                   # This file
``` 

## Features

### Current Release (v0.1)
- **Input Processing**: Paste and parse raw dialogue
- **Live Preview**: Real-time output visualization
- **Metadata Management**: Add context headers and footers
- **Participant Tracking**: Manual and (future) automatic detection
- **Output Controls**: Copy and download formatted markdown
- **Responsive UI**: Desktop and mobile compatible

### Design Philosophy: Structural Entropy
The application embodies a design philosophy emphasizing the visual transition from chaos to order:
- Dark, minimalist interface
- Monospace typography suggesting archival precision
- Progressive structure: raw input → processed output
- Accent colors indicate resolution/completion

## Getting Started

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Node.js for backend development
- Optional: Python 3.7+ for advanced processing

### Quick Start

1. **Open the Interface**
   ```bash
   # Open ui/index.html in your web browser
   # Or serve via local web server:
   python -m http.server 8000
   ```

2. **Basic Workflow**
   - Paste dialogue content into the input field
   - Configure metadata (participants, context)
   - Click "Convert" to process
   - Copy or download the output

3. **API Integration** (Planned)
   - Add OpenAI API key for intelligent processing
   - Enable automatic label detection
   - Access advanced analysis features

## Usage Examples

### Example 1: Basic Dialogue Processing
**Input**: Raw conversation between AI colleagues
**Output**: Structured dialogue with labels, participants, and metadata

See `example-database/input-01.md` and `output-01.md` for a complete example.

### Example 2: Team Meeting Transcription
Process team meeting discussions into standardized format with:
- Speaker identification
- Content type classification
- Emotional tone markers
- Action items extraction

## Technical Architecture

### Frontend (ui/)
- **HTML**: Semantic structure with form controls
- **CSS**: Structural Entropy design system
- **JavaScript**: Client-side dialogue processing and rendering

### Backend (Python)
- **DialogueProcessor**: Core parsing and labeling logic
- **DialogueDatabase**: Example storage and retrieval
- **Extensible**: Ready for API integration

## Development Roadmap

### Phase 1 (Current)
- [x] Basic UI structure
- [x] Input/output fields
- [x] Participant management
- [x] Markdown export
- [ ] Local file storage

### Phase 2 (Next)
- [ ] OpenAI API integration
- [ ] Automatic speaker detection
- [ ] Tone/emotion classification
- [ ] Batch processing
- [ ] Template system

### Phase 3 (Future)
- [ ] Cloud storage integration
- [ ] Collaborative editing
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app

## Competitive Applications

### Tech Prize Alignment
- **Category**: AI/ML Tools & Innovation
- **Uniqueness**: Specialized for AI dialogue standardization
- **Impact**: Enables systematic improvement of AI workflows
- **Scalability**: Adaptable for various dialogue domains

### Competition Readiness
- Designed for [tech-prize.org](https://tech-prize.org/app-competition/)
- Meets hackathon evaluation criteria
- Demonstrates innovation in AI process management

## Contributing

### For NAFO Cloud Team
1. Test the UI interface
2. Provide feedback on dialogue processing
3. Contribute example dialogues
4. Suggest additional features

### Development Guidelines
- Follow Structural Entropy design principles
- Maintain monospace typography for technical content
- Keep interfaces minimal and purposeful
- Prioritize clarity over decoration

## Configuration

### OpenAI Integration (Planned)
```python
processor = DialogueProcessor(api_key='sk-...')
```

### Custom Processing
```python
processor = DialogueProcessor()
output = processor.process(
    raw_text="...",
    header="Metadata: ...",
    footer="Notes: ..."
)
```

## License

Part of NAFO Cloud Development Initiative

## Support & Questions

For questions about the Dialogue Archivist project:
- Review the `ui/README.md` for UI-specific documentation
- Check `example-database/` for usage examples
- Refer to `dialogue_archivist.py` for backend capabilities

---

**Version**: 0.1  
**Last Updated**: 2026-03-22 13:48:00  
**Status**: Active Development - This UI is a minimal test harness for Dialogue Archivist v1 pipeline validation.
