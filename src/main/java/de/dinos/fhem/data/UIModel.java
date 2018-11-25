package de.dinos.fhem.data;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.Charset;

public class UIModel extends ContainerOf<Page> {

  public UIModel(String myName) {
    super(myName, "pages");
  }

  public void addPage(Page page) {
    addElement(page);
  }

  public void removePage(Page page) {
    removeElement(page);
  }

  public void removePage(String pageName) {
    removeElement(pageName);
  }

  public void writeToFile(File file) {
    file.getAbsoluteFile().getParentFile().mkdirs();
    try {
      FileWriter fileWriter = new FileWriter(file);
      write(fileWriter, 2, 0);
      fileWriter.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  public static UIModel readFromFile(File file) {
    try {
      String string = FileUtils.readFileToString(file, Charset.defaultCharset());
      JSONObject modelObject = new JSONObject(string);
      UIModel model = new UIModel(modelObject.getString("name"));
      for (String modelKey : modelObject.keySet()) {
        Object modelValue = modelObject.get(modelKey);
        if (modelValue instanceof JSONArray && model.getContainerName().equals(modelKey)) {
          JSONArray pagesArray = modelObject.getJSONArray(model.getContainerName());
          for (int p = 0; p < pagesArray.length(); p++) {
            JSONObject pageObject = pagesArray.getJSONObject(p);

            Page page = new Page(pageObject.getString("name"));
            for (String pageKey : pageObject.keySet()) {
              Object pageValue = pageObject.get(pageKey);
              if (pageValue instanceof JSONArray && page.getContainerName().equals(pageKey)) {
                JSONArray cellsArray = pageObject.getJSONArray(pageKey);
                for (int c = 0; c < cellsArray.length(); c++) {
                  JSONObject cellObject = cellsArray.getJSONObject(c);

                  Cell cell = new Cell(cellObject.getString("name"));
                  for (String cellKey : cellObject.keySet()) {
                    Object cellValue = cellObject.get(cellKey);
                    if (cellValue instanceof JSONArray && cell.getContainerName().equals(cellKey)) {
                      JSONArray viewsArray = cellObject.getJSONArray(cellKey);
                      for (int v = 0; v < viewsArray.length(); v++) {
                        JSONObject viewObject = viewsArray.getJSONObject(v);
                        View view = new View(viewObject.getString("name"));
                        for (String viewKey : viewObject.keySet()) {
                          Object viewValue = viewObject.get(viewKey);
                          view.put(viewKey, viewValue);
                        }
                        cell.addView(view);
                      }
                    } else {
                      cell.put(cellKey, cellValue);
                    }
                  }
                  page.addCell(cell);
                }
              } else {
                page.put(pageKey, pageValue);
              }
            }
            model.addPage(page);
          }
        } else {
          model.put(modelKey, modelValue);
        }
      }

      return model;
    } catch (IOException ignore) {

    }
    UIModel uiModel = new UIModel("empty");
    Page page = new Page("home");
    uiModel.addPage(page);
    return uiModel;
  }

  public static void main(String[] args) {
    UIModel model = new UIModel("home");

    Page page1 = new Page("page 1");
    Page page2 = new Page("page 2");

    model.addPage(page1);
    model.addPage(page2);

    JSONArray array = new JSONArray();
    array.put(new JSONObject().put("extra 1", "value 1"));
    array.put(new JSONObject().put("extra 2", "value 2"));
    model.put("extras", array);

    Cell cell1page1 = new Cell("cell 1 in page 1");
    Cell cell2page1 = new Cell("cell 2 in page 1");
    page1.addCell(cell1page1);
    page1.addCell(cell2page1);

    Cell cell1page2 = new Cell("cell 1 in page 2");
    Cell cell2page2 = new Cell("cell 2 in page 2");
    Cell cell3page2 = new Cell("cell 3 in page 2");

    cell2page2.addView(new View("labelView"));

    page2.addCell(cell1page2);
    page2.addCell(cell2page2);
    page2.addCell(cell3page2);

    page2.removeCell(cell2page2);

    model.removePage(page1);

    File file = new File("model.json");
    model.writeToFile(file);
    UIModel model1 = UIModel.readFromFile(file);

    File file2 = new File("model2.json");
    model1.writeToFile(file2);

    System.out.println("Write to file and read back was " + (model.similar(model1) ? "Ok" : "NOT OK"));

    UIModel model2 = UIModel.readFromFile(new File("empty"));
    System.out.println(model2);
  }

}
