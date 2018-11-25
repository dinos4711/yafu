package de.dinos.fhem.data;

import org.json.JSONObject;

import java.util.UUID;

class BaseElement extends JSONObject implements Comparable<BaseElement> {
  private static final String KEY_ID = "id";
  private static final String KEY_NAME = "name";

  BaseElement(String myName) {
    put(KEY_NAME, myName);
    put(KEY_ID, UUID.randomUUID().toString());
  }

  public String getId() {
    return getString(KEY_ID);
  }

  public String getName() {
    return getString(KEY_NAME);
  }

  @Override
  public int compareTo(BaseElement o) {
    int ret = getName().compareTo(o.getName());
    if (ret == 0) {
      ret = getId().compareTo(o.getId());
    }
    return ret;
  }
}
