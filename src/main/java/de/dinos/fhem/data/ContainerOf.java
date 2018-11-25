package de.dinos.fhem.data;

import org.json.JSONArray;

import java.util.Set;
import java.util.TreeSet;

public class ContainerOf<ELEMENT extends BaseElement> extends BaseElement {

  private String containerName;

  ContainerOf(String myName, String containerName) {
    super(myName);
    this.containerName = containerName;
    put(containerName, new JSONArray());
  }

  String getContainerName() {
    return containerName;
  }

  public void clear() {
    put(containerName, new JSONArray());
  }

  public boolean isEmpty() {
    return getJSONArray(containerName).isEmpty();
  }

  void addElement(ELEMENT element) {
    JSONArray elements = getJSONArray(containerName);
    removeElement(element);
    elements.put(element);
  }

  void removeElement(ELEMENT element) {
    removeElement(element.getId());
  }

  void removeElement(String elementId) {
    JSONArray elements = getJSONArray(containerName);
    for (int i = 0; i < elements.length(); i++) {
      ELEMENT currentElement = (ELEMENT) elements.getJSONObject(i);
      if (elementId.equals(currentElement.getId())) {
        elements.remove(i);
        break;
      }
    }
  }

  public Set<ELEMENT> getElements() {
    Set<ELEMENT> ret = new TreeSet<>();

    JSONArray elements = getJSONArray(containerName);
    for (int i = 0; i < elements.length(); i++) {
      ELEMENT element = (ELEMENT) elements.getJSONObject(i);
      ret.add(element);
    }

    return ret;
  }

}
