package de.dinos.fhem.web;

import de.dinos.fhem.comm.Device;
import de.dinos.fhem.comm.Devices;
import de.dinos.fhem.comm.FhemClient;
import de.dinos.fhem.config.Configuration;
import de.dinos.fhem.data.Cell;
import de.dinos.fhem.data.Page;
import de.dinos.fhem.data.UIModel;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Controller
public class FhemController {

  static Devices devices = null;

  public FhemController() {
    System.out.println("Loading " + FhemController.class.getSimpleName());
    File file = new File("test");
    System.out.println(file.getAbsolutePath());
  }

  @GetMapping("/greeting")
  public String greeting(@RequestParam(name = "name", required = false, defaultValue = "World") String name, Model model) {
    model.addAttribute("name", name);
    return "greeting";
  }

  @RequestMapping(value = "/saveConfiguration", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String saveConfiguration(@RequestParam(name = "config", required = true) String config) {

    try {
      Configuration.store(config);
    } catch (IOException e) {
      e.printStackTrace();
      return "Error";
    }
    return "Ok";
  }

  @RequestMapping(value = "/getConfiguration", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getConfiguration() {
    try {
      String config = Configuration.read();
      JSONTokener jsonTokener = new JSONTokener(config);
      JSONObject configObject = new JSONObject(jsonTokener);
      return configObject.toString();
    } catch (Throwable e) {
      JSONObject configObject = new JSONObject();
      configObject.put("mode", "edit");
      try {
        Configuration.store(configObject.toString());
      } catch (IOException e1) {
        e1.printStackTrace();
      }
      return configObject.toString();
    }
  }

  @RequestMapping(value = "/getUIContent", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getUIContent(@RequestParam(name = "page", required = false, defaultValue = "Home") String pageName) {
    UIModel uiModel = UIModel.readFromFile(new File("ui.json"));
    Page page = uiModel.getPage(pageName);
    if (page != null) {
      JSONObject result = new JSONObject();
      result.put("page", page);
      if (uiModel.has("menu")) {
        JSONObject menuObject = (JSONObject) uiModel.get("menu");
        JSONArray entries = menuObject.getJSONArray("entries");
        for (Page onePage : uiModel.getElements()) {
          JSONObject entry;

          boolean found = false;
          for (Object o : entries) {
            entry = (JSONObject) o;
            if (entry.get("name").equals(onePage.getName())) {
              found = true;
              break;
            }
          }
          if (!found) {
            entry = new JSONObject();
            entry.put("name", onePage.getName());
            entries.put(entry);
          }
        }

        result.put("menu", menuObject);
      }
      return result.toString();
    } else {
      return new JSONObject().toString();
    }
  }

  @RequestMapping(value = "/getTimers", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getTimers(@RequestParam(name = "deviceName", required = true) String deviceName) {
    JSONArray result = new JSONArray();

    devices = getDevices();
    for (Device device : devices) {
      if ("at".equals(device.getType()) && device.getName().startsWith("yafu_" + deviceName + "_")) {
        result.put(device.toJSON());
      }
    }

    return result.toString();
  }

  @RequestMapping(value = "/getDeviceSetters", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getDeviceSetters(@RequestParam(name = "device", required = true) String deviceName) {
    devices = getDevices();

    JSONArray jsonSetters = new JSONArray();

    for (Device device : devices) {
      if (deviceName.equals(device.getName())) {
        for (String setterName : device.getSetters().keySet()) {
          List<String> valueList = device.getSetters().get(setterName);
          JSONObject jsonSetter = new JSONObject();
          jsonSetter.put(setterName, StringUtils.join(valueList, ","));
          jsonSetters.put(jsonSetter);
        }
      }
    }

    return jsonSetters.toString();
  }

  @RequestMapping(value = "/getContentFromServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getContentFromServer(@RequestParam(name = "cmd", required = true) String cmd) {
    if ("getDevices".equals(cmd)) {
      devices = getDevices();
      Set<String> deviceNames = devices.getDeviceNames();
      JSONArray names = new JSONArray();
      for (String deviceName : deviceNames) {
        names.put(deviceName);
      }
      return names.toString();
    }

    if ("getDevicesWithSwitches".equals(cmd)) {
      devices = getDevices();
      Map<Device, List<String>> switchDevices = new TreeMap<>();

      for (Device device : devices) {
        if (device.getSetters().get("on") != null && device.getSetters().get("off") != null && device.getReadings().contains("state")) {
          List<String> setters = switchDevices.computeIfAbsent(device, device1 -> new ArrayList<>());
          setters.add(null);
        }
        for (Map.Entry<String, List<String>> keyValues : device.getSetters().entrySet()) {
          String setter = keyValues.getKey();
          List<String> values = keyValues.getValue();
          if (values.contains("on") && values.contains("off")) {
            List<String> setters = switchDevices.computeIfAbsent(device, device1 -> new ArrayList<>());
            setters.add(setter);
          }
        }
      }

      JSONArray jsonDevices = new JSONArray();
      for (Map.Entry<Device, List<String>> deviceListEntry : switchDevices.entrySet()) {
        for (String setter : deviceListEntry.getValue()) {
          JSONObject jsonDevice = new JSONObject();
          Device device = deviceListEntry.getKey();
          String name = device.getName();
          String displayName = device.getDisplayName();
          if (setter != null) {
            name += " " + setter;
            displayName += " (" + setter + ")";
          }
          jsonDevice.put("deviceName", name);
          jsonDevice.put("displayName", displayName);

          jsonDevices.put(jsonDevice);
        }
      }
      return jsonDevices.toString();
    }

    if ("getDevicesWithSliders".equals(cmd) || "getDevicesWithGauges".equals(cmd) || "getDevicesWithTimerButtons".equals(cmd)) {
      devices = getDevices();
      JSONArray jsonDevices = new JSONArray();
      int minValueCount = "getDevicesWithTimerButtons".equals(cmd) ? 0 : 2;
      Map<Device, Map<String, List<String>>> devicesWithSliders = devices.getDevicesWithPossibleSetters(minValueCount);
      for (Device device : devicesWithSliders.keySet()) {
        Map<String, List<String>> stringListMap = devicesWithSliders.get(device);
        JSONObject jsonDevice = new JSONObject();
        jsonDevice.put("deviceName", device.getName());
        jsonDevice.put("displayName", device.getDisplayName());

          JSONArray jsonSetters = new JSONArray();
          for (String setterName : stringListMap.keySet()) {
            List<String> valueList = stringListMap.get(setterName);
            JSONObject jsonSetter = new JSONObject();
            jsonSetter.put(setterName, StringUtils.join(valueList, ","));

            jsonSetters.put(jsonSetter);
          }
          jsonDevice.put("setters", jsonSetters);

        jsonDevices.put(jsonDevice);
      }
      return jsonDevices.toString();
    }

    if ("getDevicesWithReadings".equals(cmd)) {
      devices = getDevices();
      JSONArray jsonDevices = new JSONArray();
      Map<Device, Set<String>> devicesWithReadings = devices.getDevicesWithReadings();
      for (Device device : devicesWithReadings.keySet()) {
        Set<String> stringList = devicesWithReadings.get(device);
        JSONObject jsonDevice = new JSONObject();
        jsonDevice.put("deviceName", device.getName());
        jsonDevice.put("displayName", device.getDisplayName());
        jsonDevice.put("readings", StringUtils.join(stringList, ","));

        jsonDevices.put(jsonDevice);
      }
      return jsonDevices.toString();
    }

    return "<b>" + System.currentTimeMillis() + "</b>";
  }

  @RequestMapping(value = "/sendNewPageToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendNewPageToServer(@RequestParam(name = "page", required = false, defaultValue = "Home") String pageName) {

    File modelFile = new File("ui.json");
    UIModel uiModel = UIModel.readFromFile(modelFile);
    uiModel.addPage(new Page(pageName));
    uiModel.writeToFile(modelFile);

    return "Ok.";
  }

  @RequestMapping(value = "/sendRemoveMenuToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendRemoveMenuToServer() {
    File modelFile = new File("ui.json");

    UIModel uiModel = UIModel.readFromFile(modelFile);
    if (uiModel.has("menu")) {
      uiModel.remove("menu");
      uiModel.writeToFile(modelFile);
    }

    return "Ok.";
  }

  @RequestMapping(value = "/sendRemoveMenuEntryToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendRemoveMenuEntryToServer(@RequestParam(name = "menuName", required = true) String menuName) {
    File modelFile = new File("ui.json");

    UIModel uiModel = UIModel.readFromFile(modelFile);
    uiModel.removePage(menuName);
    JSONObject menu = (JSONObject) uiModel.get("menu");
    JSONArray entries = (JSONArray) menu.get("entries");

    for (int i = 0; i < entries.length(); i++) {
      JSONObject menuEntry = entries.getJSONObject(i);
      if (menuEntry.getString("name").equals(menuName)) {
        entries.remove(i);
        break;
      }
    }

    uiModel.writeToFile(modelFile);

    return "Ok.";
  }

  @RequestMapping(value = "/sendMenuToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendMenuToServer(@RequestParam(name = "menu", required = true) String menu) {
    File modelFile = new File("ui.json");

    UIModel uiModel = UIModel.readFromFile(modelFile);
    JSONObject menuObject = new JSONObject(menu);
    JSONObject myMenu;
    if (!uiModel.has("menu")) {
      uiModel.put("menu", new JSONObject());

    }
    myMenu = (JSONObject) uiModel.get("menu");

    for (String key : menuObject.keySet()) {
      myMenu.put(key, menuObject.get(key));
    }

    uiModel.writeToFile(modelFile);

    return "Ok.";
  }

  @RequestMapping(value = "/sendCellToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendCellToServer(@RequestParam(name = "cell", required = true) String cell,
                          @RequestParam(name = "page", required = false, defaultValue = "Home") String pageName) {

    File modelFile = new File("ui.json");
    UIModel uiModel = UIModel.readFromFile(modelFile);
    JSONObject cellObject = new JSONObject(cell);
    Cell newCell = new Cell(cellObject.getString("name"));
    newCell.put("id", cellObject.getString("id"));

    for (String key : cellObject.keySet()) {
      newCell.put(key, cellObject.get(key));
    }

    Page page = uiModel.getPage(pageName);
    page.addCell(newCell);
    uiModel.writeToFile(modelFile);

    return "Ok.";
  }

  @RequestMapping(value = "/sendRemoveCellToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendRemoveCellToServer(@RequestParam(name = "cell", required = true) String cell,
                                @RequestParam(name = "page", required = false, defaultValue = "Home") String pageName) {

    File modelFile = new File("ui.json");
    UIModel uiModel = UIModel.readFromFile(modelFile);
    JSONObject cellObject = new JSONObject(cell);
    Page page = uiModel.getPage(pageName);
    page.removeCell(cellObject.getString("id"));
    uiModel.writeToFile(modelFile);

    return "Ok.";
  }

  private Devices getDevices() {
    try {
      FhemClient fhemClient = new FhemClient();

      String csrfToken = fhemClient.getCsrfToken();
      return fhemClient.getDevices(csrfToken);
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;
  }

  public static void main(String[] args) {
    FhemController fhemController = new FhemController();
    String result = fhemController.getContentFromServer("getDevicesWithSwitches");
    System.out.println(result);
  }
}
