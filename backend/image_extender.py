import datetime
import os
import torch
from diffusers import (
    StableDiffusionInpaintPipeline,
    DDIMScheduler,
)
from PIL import Image
import io

class StableDiffusionImageExtender:
    def __init__(self, model_path="runwayml/stable-diffusion-inpainting", device=None):
        """
        Initialize the image extender with a Stable Diffusion model.

        Args:
            model_path (str): Path to the model or model identifier from huggingface.co/models
            device (str): Device to run the model on ("cuda" or "cpu"). Defaults to "cuda" if available, else "cpu"
        """
        # Set device automatically if not specified
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"

        self.device = device
        
        # Load the Stable Diffusion inpainting pipeline
        self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        
        # Configure scheduler
        self.pipe.scheduler = DDIMScheduler.from_config(self.pipe.scheduler.config)
        
        # Move pipeline to the specified device
        self.pipe = self.pipe.to(device)
        
        # Optimize for CUDA if applicable
        if device == "cuda":
            self.pipe.enable_attention_slicing()

    def extend_image(self, image_bytes, target_ratio=16/9):
        """
        Resize image to 1080x1080 and extend to 1920x1080 (16:9) using Stable Diffusion outpainting.
        
        Args:
            image_bytes (bytes): Input image as bytes.
            target_ratio (float): Target aspect ratio (width/height), defaults to 16/9.
            
        Returns:
            bytes: Extended image in PNG format.
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Define target dimensions
        target_width = 1920
        target_height = 1080
        square_size = 1080
        
        # Step 1: Resize to 1080x1080 square with padding if needed
        square_image = Image.new('RGB', (square_size, square_size), (0, 0, 0))
        
        # Calculate resize dimensions while maintaining aspect ratio
        orig_width, orig_height = image.size
        ratio = min(square_size / orig_width, square_size / orig_height)
        new_width = int(orig_width * ratio)
        new_height = int(orig_height * ratio)
        
        # Resize image
        resized_image = image.resize((new_width, new_height), Image.LANCZOS)
        
        # Center the resized image on the square canvas
        offset_x = (square_size - new_width) // 2
        offset_y = (square_size - new_height) // 2
        square_image.paste(resized_image, (offset_x, offset_y))
        
        # Step 2: Create 1920x1080 canvas
        extended = Image.new('RGB', (target_width, target_height), (2, 2, 2))
        
        # Calculate padding needed
        pad_left = (target_width - square_size) // 2
        
        # Paste square image in center
        extended.paste(square_image, (pad_left, 0))
        
        # Create mask by identifying all black/near-black pixels
        import numpy as np
        img_array = np.array(extended)
        
        # Improved mask detection - find pixels where RGB values are very dark
        black_threshold = 5
        mask_array = np.all(img_array <= black_threshold, axis=2).astype(np.uint8) * 255
        mask = Image.fromarray(mask_array)
        
        # Create prompt for natural extension
        prompt = "Extend this image seamlessly, maintaining the same style and scene"
        
        # Run inpainting on the entire image
        result = self.pipe(
            prompt=prompt,
            image=extended,
            mask_image=mask,
            num_inference_steps=50,
            guidance_scale=7.5
        ).images[0]
        
        # IMPORTANT: Ensure the output is 1920x1080
        if result.size != (target_width, target_height):
            print(f"Warning: Model returned {result.size} instead of {target_width}x{target_height}, resizing...")
            result = result.resize((target_width, target_height), Image.LANCZOS)
        
        # Save the extended image to stored_images/
        if not os.path.exists('stored_images'):
            os.makedirs('stored_images')
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"stored_images/extended_{timestamp}.png"
        result.save(filename, format='PNG')
        
        # Convert to PNG bytes and return
        output_bytes = io.BytesIO()
        result.save(output_bytes, format='PNG')
        return output_bytes.getvalue()

    def __call__(self, image_bytes):
        """
        Convenience method to call extend_image with default 16:9 ratio.

        Args:
            image_bytes (bytes): Input image as bytes

        Returns:
            bytes: Extended image in PNG format
        """
        return self.extend_image(image_bytes)