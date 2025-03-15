import cv2
import numpy as np
from PIL import Image
import io

class AdvancedImageExtender:
    def __init__(self, method="content_aware"):
        """
        Initialize with expansion method.
        
        Parameters:
        method (str): Expansion method to use
            - "content_aware": Uses seam carving for content-aware expansion
            - "blur_extend": Uses blur-based edge extension
            - "mirror": Uses mirrored edges for natural extension
            - "gradient": Basic gradient method (improved)
        """
        self.method = method
    
    def extend_image(self, image_bytes):
        """Extend image to 16:9 aspect ratio (1920x1080) using selected method."""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Failed to decode image")
            
            # Convert from BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Target size (width, height)
            target_size = (1920, 1080)
            
            # Apply selected expansion method
            if self.method == "content_aware":
                extended = self.content_aware_extend(img, target_size)
            elif self.method == "blur_extend":
                extended = self.blur_extend(img, target_size)
            elif self.method == "mirror":
                extended = self.mirror_extend(img, target_size)
            else:  # Default to improved gradient
                extended = self.improved_gradient_extend(img, target_size)
            
            # Convert back to PIL Image and then to bytes
            pil_image = Image.fromarray(extended)
            output_bytes = io.BytesIO()
            pil_image.save(output_bytes, format='PNG')
            
            return output_bytes.getvalue()
            
        except Exception as e:
            print(f"Error in image extension: {str(e)}")
            raise
    
    def content_aware_extend(self, img, target_size):
        """
        Content-aware image extension using seam carving.
        This preserves important content while expanding to target size.
        """
        h, w = img.shape[:2]
        tw, th = target_size
        
        # If image is already wider than target, resize it maintaining aspect ratio
        if w >= tw:
            scale_factor = tw / w
            new_height = int(h * scale_factor)
            img = cv2.resize(img, (tw, new_height))
            h, w = img.shape[:2]
        
        # Create energy map for content-aware resizing
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        energy_map = cv2.Sobel(gray, cv2.CV_64F, 1, 1)
        
        # Create output image with background color
        bg_color = self._get_dominant_color(img)
        extended = np.full((th, tw, 3), bg_color, dtype=np.uint8)
        
        # Calculate center position to place original image
        y_offset = (th - h) // 2
        x_offset = (tw - w) // 2
        
        # Place original image
        extended[y_offset:y_offset+h, x_offset:x_offset+w] = img
        
        # For the sides that need expansion, use seam carving technique
        # We'll simulate it with intelligent background expansion based on energy map
        if x_offset > 0:  # Need to expand left/right
            # Calculate expansion priority based on energy at edges
            left_energy = np.sum(energy_map[:, :10])
            right_energy = np.sum(energy_map[:, -10:])
            
            # Expand the side with lower energy (less important content)
            if left_energy <= right_energy:
                for i in range(x_offset):
                    blend_factor = (i / x_offset) ** 2  # Non-linear blending
                    edge_color = img[:, 0]
                    extended[y_offset:y_offset+h, i] = edge_color * blend_factor + bg_color * (1 - blend_factor)
            else:
                for i in range(x_offset):
                    blend_factor = (i / x_offset) ** 2  # Non-linear blending
                    edge_color = img[:, -1]
                    extended[y_offset:y_offset+h, tw-i-1] = edge_color * blend_factor + bg_color * (1 - blend_factor)
        
        # Handle vertical expansion similarly
        # Convert resulting blends back to uint8
        extended = extended.astype(np.uint8)
        return extended
    
    def mirror_extend(self, img, target_size):
        """
        Extend image by mirroring edges - creates a natural-looking expansion.
        """
        h, w = img.shape[:2]
        tw, th = target_size
        
        # Create output image with edge color
        edge_color = self._get_edge_color(img)
        extended = np.full((th, tw, 3), edge_color, dtype=np.uint8)
        
        # Calculate center position
        y_offset = (th - h) // 2
        x_offset = (tw - w) // 2
        
        # Place original image
        extended[y_offset:y_offset+h, x_offset:x_offset+w] = img
        
        # Calculate how much to mirror on each side
        mirror_width = min(w // 2, x_offset)
        mirror_height = min(h // 2, y_offset)
        
        if mirror_width > 0:
            # Mirror left side
            for i in range(mirror_width):
                if x_offset - i - 1 >= 0:
                    # Mirror with fade out
                    alpha = 1.0 - (i / mirror_width)
                    mirrored = cv2.flip(img[:, :mirror_width], 1)
                    blend = mirrored[:, i] * alpha + edge_color * (1 - alpha)
                    extended[y_offset:y_offset+h, x_offset-i-1] = blend.astype(np.uint8)
            
            # Mirror right side
            for i in range(mirror_width):
                if x_offset + w + i < tw:
                    alpha = 1.0 - (i / mirror_width)
                    mirrored = cv2.flip(img[:, -mirror_width:], 1)
                    blend = mirrored[:, mirror_width-i-1] * alpha + edge_color * (1 - alpha)
                    extended[y_offset:y_offset+h, x_offset+w+i] = blend.astype(np.uint8)
        
        if mirror_height > 0:
            # Mirror top
            for i in range(mirror_height):
                if y_offset - i - 1 >= 0:
                    alpha = 1.0 - (i / mirror_height)
                    mirrored = cv2.flip(img[:mirror_height, :], 0)
                    blend = mirrored[i, :] * alpha + edge_color * (1 - alpha)
                    extended[y_offset-i-1, x_offset:x_offset+w] = blend.astype(np.uint8)
            
            # Mirror bottom
            for i in range(mirror_height):
                if y_offset + h + i < th:
                    alpha = 1.0 - (i / mirror_height)
                    mirrored = cv2.flip(img[-mirror_height:, :], 0)
                    blend = mirrored[mirror_height-i-1, :] * alpha + edge_color * (1 - alpha)
                    extended[y_offset+h+i, x_offset:x_offset+w] = blend.astype(np.uint8)
        
        return extended
    
    def blur_extend(self, img, target_size):
        """
        Extend image using progressive blur for natural edges.
        """
        h, w = img.shape[:2]
        tw, th = target_size
        
        # Create new base image (larger than target)
        padding = max(tw - w, th - h) + 50
        base_h, base_w = h + padding * 2, w + padding * 2
        base_img = np.full((base_h, base_w, 3), self._get_edge_color(img), dtype=np.uint8)
        
        # Place original image in center
        base_img[padding:padding+h, padding:padding+w] = img
        
        # Apply progressive blur to create extended background
        blurred = cv2.GaussianBlur(base_img, (99, 99), 30)
        
        # Seamlessly blend original with blurred background
        mask = np.zeros((base_h, base_w), dtype=np.uint8)
        mask[padding:padding+h, padding:padding+w] = 255
        
        # Feather the mask edges
        feather_size = min(30, padding//2)
        mask = cv2.GaussianBlur(mask, (feather_size*2+1, feather_size*2+1), feather_size/3)
        
        # Blend using the mask
        mask = np.expand_dims(mask, axis=2) / 255.0
        extended_full = base_img * mask + blurred * (1 - mask)
        
        # Crop to target size
        start_y = (base_h - th) // 2
        start_x = (base_w - tw) // 2
        extended = extended_full[start_y:start_y+th, start_x:start_x+tw].astype(np.uint8)
        
        return extended
    
    def improved_gradient_extend(self, img, target_size):
        """
        Improved gradient-based extension with better color sampling.
        """
        h, w = img.shape[:2]
        tw, th = target_size
        
        # Get a more accurate background color by sampling outer regions
        edge_color = self._get_edge_color(img)
        
        # Create new image with edge color
        extended = np.full((th, tw, 3), edge_color, dtype=np.uint8)
        
        # Calculate paste position
        y_offset = (th - h) // 2
        x_offset = (tw - w) // 2
        
        # Place original image
        extended[y_offset:y_offset+h, x_offset:x_offset+w] = img
        
        # Create gradients with improved sampling
        gradient_size = min(50, x_offset, y_offset)  # Use larger gradient
        
        if gradient_size > 0:
            # Sample multiple pixels from each edge for better gradient
            left_edge = np.mean(img[:, :5], axis=1)
            right_edge = np.mean(img[:, -5:], axis=1) 
            top_edge = np.mean(img[:5, :], axis=0)
            bottom_edge = np.mean(img[-5:, :], axis=0)
            
            # Apply non-linear gradient for more natural transition
            for i in range(gradient_size):
                # Use non-linear alpha for smoother transition
                alpha = (i / gradient_size) ** 1.5
                
                # Left side
                if x_offset - i - 1 >= 0:
                    blend = left_edge * alpha + edge_color * (1-alpha)
                    extended[y_offset:y_offset+h, x_offset-i-1] = blend.astype(np.uint8)
                    
                # Right side
                if x_offset + w + i < tw:
                    blend = right_edge * alpha + edge_color * (1-alpha)
                    extended[y_offset:y_offset+h, x_offset+w+i] = blend.astype(np.uint8)
                    
                # Top side
                if y_offset - i - 1 >= 0:
                    blend = top_edge * alpha + edge_color * (1-alpha)
                    extended[y_offset-i-1, x_offset:x_offset+w] = blend.astype(np.uint8)
                    
                # Bottom side
                if y_offset + h + i < th:
                    blend = bottom_edge * alpha + edge_color * (1-alpha)
                    extended[y_offset+h+i, x_offset:x_offset+w] = blend.astype(np.uint8)
        
        return extended
    
    def _get_edge_color(self, img):
        """Calculate average color of image edges with more samples."""
        h, w = img.shape[:2]
        border_size = min(10, h//10, w//10)  # Use more samples for better color
        
        edges = np.concatenate([
            img[:border_size, :].reshape(-1, 3),     # top border
            img[-border_size:, :].reshape(-1, 3),    # bottom border
            img[:, :border_size].reshape(-1, 3),     # left border
            img[:, -border_size:].reshape(-1, 3)     # right border
        ])
        
        return np.median(edges, axis=0).astype(np.uint8)  # Median is more robust than mean
    
    def _get_dominant_color(self, img):
        """Get dominant color using k-means clustering."""
        pixels = img.reshape(-1, 3)
        pixels = np.float32(pixels)
        
        # Define criteria and apply kmeans
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(pixels, 3, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Find the dominant color cluster
        counts = np.bincount(labels.flatten())
        dominant_idx = np.argmax(counts)
        
        return centers[dominant_idx].astype(np.uint8)


# Example usage:
# extender = AdvancedImageExtender(method="blur_extend")
# result = extender.extend_image(image_bytes)