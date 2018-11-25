package de.dinos.fhem.data;

public class Cell extends ContainerOf<View> {

  public Cell(String myName) {
    super(myName, "views");
  }

  public void addView(View view) {
    addElement(view);
  }

  public void removeView(View view) {
    removeElement(view);
  }

  public void removeView(String viewId) {
    removeElement(viewId);
  }
  
}
