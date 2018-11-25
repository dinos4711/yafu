package de.dinos.fhem.config;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;

public class Configuration {
  private static boolean encrypted = true;

  public static void store(String config) throws IOException {
    File file = new File("ui-config.json");
    if (!encrypted) {
      FileUtils.writeStringToFile(file, config);
    } else {
      FileUtils.writeStringToFile(file, CryptoUtils.encrypt(config));
    }
  }

  public static String read() throws IOException {
    File file = new File("ui-config.json");
    if (!encrypted) {
      return FileUtils.readFileToString(file);
    } else {
      byte[] bytes = FileUtils.readFileToByteArray(file);
      return CryptoUtils.decrypt(new String(bytes));
    }
  }
}
