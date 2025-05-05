import os
import hashlib
import itertools


def simple_encrypt_bytes(data, fingerprint):
    """
    Encrypt bytes using a simple XOR-based encryption with fingerprint-derived key

    Args:
        data (bytes): The data to encrypt
        fingerprint (str or bytes): The fingerprint to derive the key from

    Returns:
        bytes: The encrypted data with salt prepended
    """
    try:
        print(f"Original data size: {len(data)} bytes")

        # Generate a key from the fingerprint
        if isinstance(fingerprint, str):
            fingerprint_bytes = fingerprint.encode()
        else:
            fingerprint_bytes = fingerprint

        # Create a salt for key derivation
        salt = os.urandom(16)

        # Generate a key using PBKDF2
        key = hashlib.pbkdf2_hmac(
            "sha256",
            fingerprint_bytes,
            salt,
            10000,  # fewer iterations for speed
            32,  # key length
        )

        print(f"Generated key (first 10 bytes): {key.hex()[:20]}...")

        # Create a repeating key stream
        key_stream = itertools.cycle(key)

        # XOR the data with the key stream
        encrypted_data = bytearray(len(data))
        for i, byte in enumerate(data):
            encrypted_data[i] = byte ^ next(key_stream)

        # Prepend the salt to the encrypted data
        result = salt + bytes(encrypted_data)

        print(f"Encrypted data size: {len(result)} bytes")
        return result

    except Exception as e:
        print(f"Error in simple_encrypt_bytes: {str(e)}")
        raise


def simple_decrypt_bytes(encrypted_data, fingerprint):
    """
    Decrypt bytes using a simple XOR-based decryption with fingerprint-derived key

    Args:
        encrypted_data (bytes): The encrypted data with salt prepended
        fingerprint (str or bytes): The fingerprint to derive the key from

    Returns:
        bytes: The decrypted data
    """
    try:
        print(f"Encrypted data size: {len(encrypted_data)} bytes")

        # Check if data is large enough to contain salt
        if len(encrypted_data) < 16:
            raise ValueError("Encrypted data is too small to contain salt")

        # Extract salt and encrypted data
        salt = encrypted_data[:16]
        data_to_decrypt = encrypted_data[16:]

        print(
            f"Salt: {salt.hex()[:10]}..., Data to decrypt size: {len(data_to_decrypt)} bytes"
        )

        # Generate the key from the fingerprint and salt
        if isinstance(fingerprint, str):
            fingerprint_bytes = fingerprint.encode()
        else:
            fingerprint_bytes = fingerprint

        # Generate a key using PBKDF2
        key = hashlib.pbkdf2_hmac(
            "sha256",
            fingerprint_bytes,
            salt,
            10000,  # same iterations as encryption
            32,  # key length
        )

        print(f"Generated key (first 10 bytes): {key.hex()[:20]}...")

        # Create a repeating key stream
        key_stream = itertools.cycle(key)

        # XOR the encrypted data with the key stream to decrypt
        decrypted_data = bytearray(len(data_to_decrypt))
        for i, byte in enumerate(data_to_decrypt):
            decrypted_data[i] = byte ^ next(key_stream)

        print(f"Decrypted data size: {len(decrypted_data)} bytes")
        return bytes(decrypted_data)

    except Exception as e:
        print(f"Error in simple_decrypt_bytes: {str(e)}")
        raise
