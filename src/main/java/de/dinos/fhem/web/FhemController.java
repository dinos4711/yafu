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

  @GetMapping("/fhem")
  public String fhem(Model model, @ModelAttribute("rooms") TreeSet<String> rooms) {
    devices = getDevices();
    Set<String> allRooms = devices.getRooms();
    rooms.addAll(allRooms);
    for (String aRoom : allRooms) {
      System.out.println(aRoom);
    }
    return "fhem";
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

  private String getReading(String device, String readingName) {
    FhemClient fhemClient = new FhemClient();
    try {
      String csrfToken = fhemClient.getCsrfToken();
      return fhemClient.getReading(csrfToken, device, readingName);
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;

  }

  @GetMapping("/room")
  public String room(Model model, @RequestParam(name = "room", required = false, defaultValue = "") String room, @ModelAttribute("devices") TreeSet<Device> devicesToShow) {
    devices = getDevices();
    if (devices != null) {
      for (Device device : devices) {
        if (device.getRooms().contains(room)) {
          devicesToShow.add(device);
        }
      }
    }
    model.addAttribute("room", room);
    return "room";
  }

  @GetMapping("/device")
  public String device(Model model, @RequestParam(name = "device", required = false, defaultValue = "") String deviceName, @ModelAttribute("sets") TreeMap<String, List<String>> sets) {
    devices = getDevices();
    if (devices != null) {
      for (Device device : devices) {
        if (deviceName.equals(device.getName())) {
          sets.putAll(device.getSets());
          break;
        }
      }
    }
    model.addAttribute("device", deviceName);
    return "device";
  }

  @RequestMapping(value = "/getDeviceReading", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getDeviceReading(@RequestParam(value = "device", required = true) String device,
                          @RequestParam(value = "reading", required = true) String reading) {

    return getReading(device, reading);
  }

  @RequestMapping(value = "/saveConfiguration", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String saveConfiguration(@RequestParam(value = "config", required = true) String config) {

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

  @RequestMapping(value = "/getContentFromServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String getContentFromServer(@RequestParam(value = "cmd", required = true) String cmd) {
    if ("getUIContent".equals(cmd)) {
      UIModel uiModel = UIModel.readFromFile(new File("ui.json"));
      return uiModel.toString();
    }
    if ("getDevices".equals(cmd)) {
      devices = getDevices();
      Set<String> deviceNames = devices.getDeviceNames();
      JSONArray names = new JSONArray();
      for (String deviceName : deviceNames) {
        names.put(deviceName);
      }
      return names.toString();
    }
    if ("getDevicesWithSliders".equals(cmd)) {
      devices = getDevices();
      JSONArray jsonDevices = new JSONArray();
      Map<Device, Map<String, List<String>>> devicesWithSliders = devices.getDevicesWithPossibleSliders();
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

  private String getModelAsHtml(UIModel uiModel) {
    Set<Page> pages = uiModel.getElements();

    String html =
        "<table>\n";
    for (Page page : pages) {
      html += "  <tr><td>" + page.getName() + "</td><td>" + page.getId() + "</td><td>";

      Set<Cell> cells = page.getElements();
      html += "<table>";
      for (Cell cell : cells) {
        html += "  <tr><td>" + cell.getName() + "</td><td>" + cell.getId() + "</td></tr>";
      }
      html += "</table>";
      html += "</td></tr>";
    }
    html += "</table>";

    return html;
  }

  @RequestMapping(value = "/sendCellToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendCellToServer(@RequestParam(value = "cell", required = true) String cell) {

    File modelFile = new File("ui.json");
    UIModel uiModel = UIModel.readFromFile(modelFile);
    JSONObject cellObject = new JSONObject(cell);
    Cell newCell = new Cell(cellObject.getString("name"));
    newCell.put("id", cellObject.getString("id"));

    for (String key : cellObject.keySet()) {
      newCell.put(key, cellObject.get(key));
    }

    Page homePage = uiModel.getElements().iterator().next();
    homePage.addCell(newCell);
    uiModel.writeToFile(modelFile);

    return getModelAsHtml(uiModel);
  }

  @RequestMapping(value = "/sendRemoveCellToServer", method = RequestMethod.GET, produces = MediaType.TEXT_HTML_VALUE)
  public @ResponseBody
  String sendRemoveCellToServer(@RequestParam(value = "cell", required = true) String cell) {

    File modelFile = new File("ui.json");
    UIModel uiModel = UIModel.readFromFile(modelFile);
    JSONObject cellObject = new JSONObject(cell);
    Page homePage = uiModel.getElements().iterator().next();
    homePage.removeCell(cellObject.getString("id"));
    uiModel.writeToFile(modelFile);

    return getModelAsHtml(uiModel);
  }

}
