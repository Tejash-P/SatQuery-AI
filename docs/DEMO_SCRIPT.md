# SIH Demo Script - 5 Minutes

## Introduction (0:00 - 0:30)
- **Presenter**: "Welcome to SatQuery AI. We built an agentic, multimodal remote sensing assistant. Instead of just chatting, our system verifies data, selects tools, and provides evidence-grounded answers."
- **Action**: Log in using `demo@satquery.ai`. The dark, ISRO-inspired dashboard loads.

## Image Upload & Validation (0:30 - 1:30)
- **Action**: Create a new project: "Mumbai Coastal Monitoring".
- **Action**: Upload an optical GeoTIFF and a SAR image.
- **Talking Point**: "Notice how the system automatically extracts metadata. It detects the first image as Optical and the second as SAR based on band characteristics, applying confidence scores."
- **Action**: Create an Optical-SAR pair.
- **Talking Point**: "The system validates geographic overlap and resolution, ensuring they are compatible before we even ask a question."

## Single Image VQA & Grounding (1:30 - 2:30)
- **Action**: Open the optical image in the workspace.
- **Action**: Ask: "Highlight the largest water body."
- **Talking Point**: "The Agentic Controller analyzes the intent, picks the Text-Guided Grounding Tool, and executes. It doesn't use a black-box LLM to hallucinate; it triggers a deterministic workflow."
- **Action**: Show the interactive map with the highlighted GeoJSON polygon. Show the Execution Trace panel confirming the tool steps and confidence score.

## Bi-Temporal Change Detection (2:30 - 3:30)
- **Action**: Switch to a bi-temporal pair of Bangalore urban growth.
- **Action**: Ask: "What changed between these two dates, and where did the change occur?"
- **Action**: Use the Swipe Slider to visually compare before and after.
- **Talking Point**: "The system identifies open land converted to built-up areas. It gives an area estimate in hectares and points out the exact spatial location. Notice the confidence warnings if there are cloud cover issues."

## Optical-SAR Fusion (3:30 - 4:30)
- **Action**: Open the Optical-SAR pair.
- **Action**: Ask: "Use both images to identify built-up and water-covered regions."
- **Talking Point**: "Optical imagery provides texture, while SAR provides structural backscatter. The system fuses these features. In the Execution Trace, you can see it ran both preprocessors, aligned the images, and generated a unified classification map."

## Export & Conclusion (4:30 - 5:00)
- **Action**: Click "Export to PDF".
- **Talking Point**: "Finally, every analysis can be exported into an auditable PDF report containing the original imagery, the generated text, confidence metrics, and visual evidence. This makes SatQuery AI a true tool for analysts, not just a toy."
- **Presenter**: "Thank you for watching."
