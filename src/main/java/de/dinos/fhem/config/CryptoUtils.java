package de.dinos.fhem.config;

import org.apache.commons.codec.binary.Base64;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;

/**
 * A utility class that encrypts or decrypts a file.
 * @author www.codejava.net
 *
 */
public class CryptoUtils {
  private static final String ALGORITHM = "AES";
  private static final String TRANSFORMATION = "AES";

  static String key = "S35qg#2fT7?aw2cr";

  public static String encrypt(String toEncrypt) {
    String encrypted = null;

    try {
      Key secretKey = new SecretKeySpec(key.getBytes(), ALGORITHM);
      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.ENCRYPT_MODE, secretKey);
      byte[] outputBytes = cipher.doFinal(toEncrypt.getBytes());
      encrypted = new String(Base64.encodeBase64(outputBytes));
    } catch (NoSuchAlgorithmException | NoSuchPaddingException | BadPaddingException | IllegalBlockSizeException | InvalidKeyException e) {
      e.printStackTrace();
    }

    return encrypted;
  }

  public static String decrypt(String toDecrypt) {
    String decrypted = null;

    try {
      byte[] bytesToDecrypt = Base64.decodeBase64(toDecrypt);
      Key secretKey = new SecretKeySpec(key.getBytes(), ALGORITHM);
      Cipher cipher = Cipher.getInstance(TRANSFORMATION);
      cipher.init(Cipher.DECRYPT_MODE, secretKey);
      byte[] outputBytes = cipher.doFinal(bytesToDecrypt);
      decrypted = new String(outputBytes);
    } catch (NoSuchAlgorithmException | NoSuchPaddingException | BadPaddingException | IllegalBlockSizeException | InvalidKeyException e) {
      e.printStackTrace();
    }

    return decrypted;
  }

}
