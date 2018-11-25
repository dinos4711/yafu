package de.dinos.fhem.comm;

import java.util.*;

public class Devices extends TreeSet<Device> {

  public Set<String> getRooms() {
    Set<String> rooms = new TreeSet<>();

    for (Device device : this) {
      rooms.addAll(device.getRooms());
    }

    return rooms;
  }

  public Set<String> getDeviceNames() {
    Set<String> deviceNames = new TreeSet<>();

    for (Device device : this) {
      deviceNames.add(device.getDisplayName());
    }

    return deviceNames;
  }

  public Map<Device, Map<String, List<String>>> getDevicesWithPossibleSliders() {
    Map<Device, Map<String, List<String>>> devicesWithSliders = new TreeMap<>();
    for (Device device : this) {
      Object type = device.getInternals().get("TYPE");
      if ("FileLog".equals(type)) {
        continue;
      }
      Map<String, List<String>> sets = device.getSets();
      for (String setName : sets.keySet()) {
        List<String> setList = sets.get(setName);
        if (setList != null && setList.size() > 1) {
          Map<String, List<String>> stringListMap = devicesWithSliders.computeIfAbsent(device, k -> new TreeMap<>());
          stringListMap.put(setName, setList);
        }
      }
    }
    return devicesWithSliders;
  }

  public Map<Device, Set<String>> getDevicesWithReadings() {
    Map<Device, Set<String>> devicesWithReadings = new TreeMap<>();
    for (Device device : this) {
      Object type = device.getInternals().get("TYPE");
      if ("FileLog".equals(type)) {
        continue;
      }
      if ("FHEMWEB".equals(type)) {
        continue;
      }
      Set<String> readings = device.getReadings();
      if (readings != null && !readings.isEmpty()) {
        devicesWithReadings.put(device, readings);
      }
    }
    return devicesWithReadings;
  }
}
