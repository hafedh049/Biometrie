import hashlib
import numpy as np
from PIL import Image
import io
import cv2


def process_fingerprint(fingerprint_binary):
    """
    Process a fingerprint image to extract minutiae and generate a hash.

    Args:
        fingerprint_binary (bytes): Binary data of the fingerprint image

    Returns:
        str: Hash of the fingerprint minutiae
    """
    try:
        # Convert binary to image
        image = Image.open(io.BytesIO(fingerprint_binary))

        # Convert to numpy array for OpenCV processing
        img_array = np.array(image)

        # Convert to grayscale if it's a color image
        if len(img_array.shape) > 2 and img_array.shape[2] > 1:
            gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_array

        # STEP 1: FINGERPRINT REGION DETECTION
        # 1.1 Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # 1.2 Apply Otsu's thresholding to get a binary image
        _, binary = cv2.threshold(
            blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        # 1.3 Apply morphological operations to clean the binary image
        kernel = np.ones((5, 5), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)

        # 1.4 Find contours to identify the fingerprint region
        contours, _ = cv2.findContours(
            cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # 1.5 Find the largest contour (assumed to be the fingerprint)
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)

            # 1.6 Create a mask for the fingerprint region
            mask = np.zeros_like(gray)
            cv2.drawContours(mask, [largest_contour], 0, 255, -1)

            # 1.7 Get bounding rectangle of the fingerprint
            x, y, w, h = cv2.boundingRect(largest_contour)

            # 1.8 Add a margin to the bounding rectangle
            margin = 10
            x = max(0, x - margin)
            y = max(0, y - margin)
            w = min(gray.shape[1] - x, w + 2 * margin)
            h = min(gray.shape[0] - y, h + 2 * margin)

            # 1.9 Crop the fingerprint region
            fingerprint_region = gray[y : y + h, x : x + w]

            # 1.10 Apply the mask to isolate the fingerprint
            fingerprint_masked = cv2.bitwise_and(
                fingerprint_region, fingerprint_region, mask=mask[y : y + h, x : x + w]
            )

            # Use the masked fingerprint region for further processing
            processed_image = fingerprint_masked
        else:
            # If no contour found, use the original grayscale image
            processed_image = gray
            x, y = 0, 0  # No cropping

        # STEP 2: FINGERPRINT ENHANCEMENT
        # 2.1 Normalize image
        normalized = cv2.normalize(processed_image, None, 0, 255, cv2.NORM_MINMAX)

        # 2.2 Apply CLAHE for better contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(normalized)

        # 2.3 Apply adaptive thresholding for better ridge/valley separation
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )

        # 2.4 Clean up the binary image
        kernel = np.ones((3, 3), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)

        # STEP 3: RIDGE THINNING (SKELETONIZATION)
        # Zhang-Suen thinning algorithm implementation
        def zhang_suen_thinning(image):
            skeleton = image.copy()
            changing = True
            while changing:
                changing = False
                # First sub-iteration
                rows, cols = skeleton.shape
                for i in range(1, rows - 1):
                    for j in range(1, cols - 1):
                        if skeleton[i, j] == 255:  # Only process white pixels
                            # Get 8-neighborhood
                            p2 = 1 if skeleton[i - 1, j] == 255 else 0
                            p3 = 1 if skeleton[i - 1, j + 1] == 255 else 0
                            p4 = 1 if skeleton[i, j + 1] == 255 else 0
                            p5 = 1 if skeleton[i + 1, j + 1] == 255 else 0
                            p6 = 1 if skeleton[i + 1, j] == 255 else 0
                            p7 = 1 if skeleton[i + 1, j - 1] == 255 else 0
                            p8 = 1 if skeleton[i, j - 1] == 255 else 0
                            p9 = 1 if skeleton[i - 1, j - 1] == 255 else 0

                            # Count white neighbors
                            white_neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9

                            if (
                                2 <= white_neighbors <= 6
                                and transitions([p2, p3, p4, p5, p6, p7, p8, p9, p2])
                                == 1
                                and p2 * p4 * p6 == 0
                                and p4 * p6 * p8 == 0
                            ):
                                skeleton[i, j] = 0
                                changing = True

                # Second sub-iteration
                for i in range(1, rows - 1):
                    for j in range(1, cols - 1):
                        if skeleton[i, j] == 255:  # Only process white pixels
                            # Get 8-neighborhood
                            p2 = 1 if skeleton[i - 1, j] == 255 else 0
                            p3 = 1 if skeleton[i - 1, j + 1] == 255 else 0
                            p4 = 1 if skeleton[i, j + 1] == 255 else 0
                            p5 = 1 if skeleton[i + 1, j + 1] == 255 else 0
                            p6 = 1 if skeleton[i + 1, j] == 255 else 0
                            p7 = 1 if skeleton[i + 1, j - 1] == 255 else 0
                            p8 = 1 if skeleton[i, j - 1] == 255 else 0
                            p9 = 1 if skeleton[i - 1, j - 1] == 255 else 0

                            # Count white neighbors
                            white_neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9

                            if (
                                2 <= white_neighbors <= 6
                                and transitions([p2, p3, p4, p5, p6, p7, p8, p9, p2])
                                == 1
                                and p2 * p4 * p8 == 0
                                and p2 * p6 * p8 == 0
                            ):
                                skeleton[i, j] = 0
                                changing = True

            return skeleton

        def transitions(pixels):
            # Count transitions from 0 to 1 in the ordered sequence
            n = 0
            for i in range(len(pixels) - 1):
                if pixels[i] == 0 and pixels[i + 1] == 1:
                    n += 1
            return n

        # Apply thinning
        skeleton = zhang_suen_thinning(cleaned)

        # STEP 4: MINUTIAE EXTRACTION
        minutiae_points = []
        rows, cols = skeleton.shape

        # Crossing Number method for minutiae extraction
        for i in range(1, rows - 1):
            for j in range(1, cols - 1):
                if skeleton[i, j] == 255:  # Ridge pixel
                    # Get 8-neighborhood
                    p = [
                        1 if skeleton[i - 1, j] == 255 else 0,
                        1 if skeleton[i - 1, j + 1] == 255 else 0,
                        1 if skeleton[i, j + 1] == 255 else 0,
                        1 if skeleton[i + 1, j + 1] == 255 else 0,
                        1 if skeleton[i + 1, j] == 255 else 0,
                        1 if skeleton[i + 1, j - 1] == 255 else 0,
                        1 if skeleton[i, j - 1] == 255 else 0,
                        1 if skeleton[i - 1, j - 1] == 255 else 0,
                    ]

                    # Calculate crossing number
                    cn = 0
                    for k in range(len(p)):
                        cn += abs(p[k] - p[(k + 1) % len(p)])

                    cn = cn // 2

                    # cn=1 : Ridge ending, cn=3 : Ridge bifurcation
                    if cn == 1 or cn == 3:
                        # Adjust coordinates to original image if cropped
                        orig_x = j + x
                        orig_y = i + y

                        minutiae_points.append((orig_x, orig_y, cn))  # x, y, type

        # STEP 5: FILTER MINUTIAE
        def filter_minutiae(points, min_distance=10):
            filtered = []
            for i, p1 in enumerate(points):
                keep = True
                for j, p2 in enumerate(filtered):
                    # Calculate Euclidean distance
                    dist = np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
                    if dist < min_distance:
                        keep = False
                        break
                if keep:
                    filtered.append(p1)
            return filtered

        minutiae_points = filter_minutiae(minutiae_points)

        # Sort minutiae points for consistent results
        minutiae_points.sort(key=lambda x: (x[0], x[1]))

        # STEP 6: CREATE MINUTIAE REPRESENTATION
        minutiae_data = b""
        for x, y, minutiae_type in minutiae_points:
            # Add coordinates and type to minutiae data
            minutiae_data += int(x).to_bytes(4, byteorder="big")
            minutiae_data += int(y).to_bytes(4, byteorder="big")
            minutiae_data += int(minutiae_type).to_bytes(1, byteorder="big")

        # Generate hash from minutiae data
        if minutiae_data:
            fingerprint_hash = hashlib.sha256(minutiae_data).hexdigest()
        else:
            # Fallback to original image if no minutiae found
            fingerprint_hash = hashlib.sha256(fingerprint_binary).hexdigest()

        return fingerprint_hash

    except Exception as e:
        # Re-raise the exception to be handled by the caller
        raise ValueError(f"Error processing fingerprint: {str(e)}")
