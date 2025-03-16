import torch
from diffusers import (
    StableDiffusionInpaintPipeline,
    DDIMScheduler,
    AutoencoderKL, 
    UNet2DConditionModel,
)
from transformers import CLIPTextModel, CLIPTokenizer
import numpy as np
from PIL import Image
import io

class StableDiffusionImageExtender:
    def __init__(self, model_path="runwayml/stable-diffusion-inpainting", device=None):
        """
        Initialize the image extender with a Stable Diffusion model.
        
        Args:
            model_path (str): Path to the model or model identifier from huggingface.co/models
            device (str): Device to run the model on ("cuda" or "cpu")
        """
        if device is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
        self.device = device
        self.pipe = StableDiffusionInpaintPipeline.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32
        )
        self.pipe.scheduler = DDIMScheduler.from_config(self.pipe.scheduler.config)
        self.pipe = self.pipe.to(device)
        
        if device == "cuda":
            self.pipe.enable_attention_slicing()
    
    def extend_image(self, image_bytes, target_ratio=16/9):
        """
        Extend an image to a target aspect ratio using Stable Diffusion outpainting.
        
        Args:
            image_bytes (bytes): Input image as bytes
            target_ratio (float): Target aspect ratio (width/height), defaults to 16:9
            
        Returns:
            bytes: Extended image in PNG format
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        init_width, init_height = image.size
        
        # Calculate target dimensions
        if init_width / init_height < target_ratio:
            # Need to extend width
            target_width = int(init_height * target_ratio)
            target_height = init_height
            
            # Calculate padding needed
            pad_left = (target_width - init_width) // 2
            pad_right = target_width - init_width - pad_left
            
            # Create extended image and mask
            extended = Image.new('RGB', (target_width, target_height))
            mask = Image.new('RGB', (target_width, target_height), 'white')
            
            # Paste original image in center
            extended.paste(image, (pad_left, 0))
            
            # Create mask where white is area to inpaint
            black_box = Image.new('RGB', (init_width, target_height), 'black')
            mask.paste(black_box, (pad_left, 0))
            
            # Create prompt for natural extension
            prompt = "Extend this image seamlessly, maintaining the same style and scene"
            
            # Run outpainting in pieces if needed
            if pad_left > 0:
                # Process left side
                left_part = self._outpaint_region(
                    extended, 
                    mask,
                    prompt,
                    0,
                    0,
                    pad_left,
                    target_height
                )
                extended.paste(left_part, (0, 0))
                
            if pad_right > 0:
                # Process right side
                right_part = self._outpaint_region(
                    extended,
                    mask,
                    prompt,
                    target_width - pad_right,
                    0,
                    pad_right,
                    target_height
                )
                extended.paste(right_part, (target_width - pad_right, 0))
                
        else:
            # Need to extend height
            target_width = init_width
            target_height = int(init_width / target_ratio)
            
            # Calculate padding needed
            pad_top = (target_height - init_height) // 2
            pad_bottom = target_height - init_height - pad_top
            
            # Create extended image and mask
            extended = Image.new('RGB', (target_width, target_height))
            mask = Image.new('RGB', (target_width, target_height), 'white')
            
            # Paste original image in center
            extended.paste(image, (0, pad_top))
            
            # Create mask where white is area to inpaint
            black_box = Image.new('RGB', (target_width, init_height), 'black')
            mask.paste(black_box, (0, pad_top))
            
            # Create prompt for natural extension
            prompt = "Extend this image seamlessly, maintaining the same style and scene"
            
            # Run outpainting in pieces if needed
            if pad_top > 0:
                # Process top side
                top_part = self._outpaint_region(
                    extended,
                    mask,
                    prompt,
                    0,
                    0,
                    target_width,
                    pad_top
                )
                extended.paste(top_part, (0, 0))
                
            if pad_bottom > 0:
                # Process bottom side
                bottom_part = self._outpaint_region(
                    extended,
                    mask,
                    prompt,
                    0,
                    target_height - pad_bottom,
                    target_width,
                    pad_bottom
                )
                extended.paste(bottom_part, (0, target_height - pad_bottom))
        
        # Convert to PNG bytes
        output_bytes = io.BytesIO()
        extended.save(output_bytes, format='PNG')
        return output_bytes.getvalue()
    
    def _outpaint_region(self, image, mask, prompt, x, y, width, height):
        """Helper method to outpaint a specific region of the image"""
        # Crop the relevant region
        region = image.crop((x, y, x + width, y + height))
        region_mask = mask.crop((x, y, x + width, y + height))
        
        # Generate outpainting
        output = self.pipe(
            prompt=prompt,
            image=region,
            mask_image=region_mask,
            num_inference_steps=50,
            guidance_scale=7.5
        ).images[0]
        
        return output
    
    def __call__(self, image_bytes):
        """
        Convenience method to call extend_image with default 16:9 ratio.
        """
        return self.extend_image(image_bytes)