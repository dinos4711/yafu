package de.dinos.fhem.data;

public class Page extends ContainerOf<Cell> {

  public Page(String myName) {
    super(myName, "cells");
  }

  public void addCell(Cell cell) {
    addElement(cell);
  }

  public void removeCell(Cell cell) {
    removeElement(cell);
  }

  public void removeCell(String cellId) {
    removeElement(cellId);
  }

  public String getName() {
    return getString("name");
  }

}
