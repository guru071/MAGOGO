import io
import math
from typing import Dict, Any

try:
    from PIL import Image, ImageStat
except ImportError:
    Image = None

class ImageFraudDetector:
    """Detects suspicious patterns in uploaded prompt thumbnails."""

    def __init__(self):
        self.enabled = Image is not None

    def analyze_image(self, image_bytes: bytes) -> Dict[str, Any]:
        if not self.enabled:
            return {
                'risk_score': 0.0,
                'risk_level': 'low',
                'signals': [],
                'features': {},
                'error': 'PIL not installed'
            }

        signals = []
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img = img.convert('RGB')
            
            # --- Extract features ---
            width, height = img.size
            stat = ImageStat.Stat(img)
            
            # Calculate standard deviation of pixels (low stddev = solid color / blank image)
            std_dev = sum(stat.stddev) / len(stat.stddev)
            
            # Brightness / Darkness
            brightness = sum(stat.mean) / len(stat.mean)
            
            features = {
                'width': width,
                'height': height,
                'std_dev': round(std_dev, 2),
                'brightness': round(brightness, 2),
            }
            
            # --- Heuristics ---
            if std_dev < 10:
                signals.append(('blank_or_solid_color', 0.8, 'Image is almost entirely a solid color'))
                
            if brightness < 15:
                signals.append(('too_dark', 0.4, 'Image is suspiciously dark'))
                
            if brightness > 240:
                signals.append(('too_bright', 0.4, 'Image is suspiciously bright/white'))
                
            aspect_ratio = width / max(height, 1)
            if aspect_ratio > 3 or aspect_ratio < 0.33:
                signals.append(('extreme_aspect_ratio', 0.3, f'Unusual aspect ratio: {aspect_ratio:.2f}'))

            risk_score = min(sum(s[1] for s in signals), 1.0)
            
            level = 'low'
            if risk_score > 0.7:
                level = 'high'
            elif risk_score > 0.4:
                level = 'medium'
                
            return {
                'risk_score': round(risk_score, 4),
                'risk_level': level,
                'signals': signals,
                'features': features,
            }

        except Exception as e:
            return {
                'risk_score': 0.0,
                'risk_level': 'low',
                'signals': [],
                'error': str(e)
            }
