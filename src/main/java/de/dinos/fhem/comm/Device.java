package de.dinos.fhem.comm;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.json.JSONObject;

import java.util.*;

import static org.apache.commons.lang3.StringUtils.split;
import static org.apache.commons.lang3.builder.ToStringStyle.SIMPLE_STYLE;

public class Device implements Comparable<Device> {
  private Map<String, List<String>> sets = new TreeMap<>(String::compareToIgnoreCase);
  private Map<String, Object> internals = new TreeMap<>(String::compareToIgnoreCase);
  private Map<String, Object> attributes = new TreeMap<>(String::compareToIgnoreCase);
  private Set<String> readings = new TreeSet<>(String::compareToIgnoreCase);
  private String name;

  public Map<String, List<String>> getSets() {
    return sets;
  }

  public Map<String, Object> getInternals() {
    return internals;
  }

  public Map<String, Object> getAttributes() {
    return attributes;
  }

  public Set<String> getReadings() {
    return readings;
  }

  public String getName() {
    return name;
  }

  public String getDisplayName() {
    if (attributes.containsKey("alias")) {
      return (String) attributes.get("alias");
    }
    return name;
  }


  public static Device fromJSON(JSONObject jsonObject) {
    Device device = new Device();

    if (jsonObject.has("Name")) {
      device.name = jsonObject.getString("Name");
    }

    if (jsonObject.has("Internals")) {
      JSONObject internals = jsonObject.getJSONObject("Internals");
      device.internals = internals.toMap();
    }

    if (jsonObject.has("Attributes")) {
      JSONObject attributes = jsonObject.getJSONObject("Attributes");
      device.attributes = attributes.toMap();
    }

    if (jsonObject.has("Readings")) {
      JSONObject attributes = jsonObject.getJSONObject("Readings");
      Map<String, Object> readings = attributes.toMap();
      device.readings.addAll(readings.keySet());
    }

    if (jsonObject.has("PossibleSets")) {
      String possibleSetsString = jsonObject.getString("PossibleSets");

      String[] possibleSets = split(possibleSetsString, " ");
      for (String possibleSet : possibleSets) {
        String[] set = split(possibleSet, ":");
        List<String> setList = device.sets.computeIfAbsent(set[0], k -> new ArrayList<>());
        if (set.length == 2) {
          String[] possibleValues = split(set[1], ",");
          setList.addAll(Arrays.asList(possibleValues));
        }
      }
    }

    return device;
  }

  public Set<String> getRooms() {
    Set<String> rooms = new TreeSet<>();

    String roomStrings = (String) attributes.get("room");
    if (roomStrings != null) {
      rooms.addAll(Arrays.asList(roomStrings.split(",")));
    }

    return rooms;
  }

  @Override
  public String toString() {
    return new ToStringBuilder(this, SIMPLE_STYLE)
        .append(name + (internals.get("TYPE") != null ? "[" + internals.get("TYPE") + "]" : ""))
        .append("sets", sets)
        .append("internals", internals)
        .append("readings", readings)
        .toString();
  }

  @Override
  public int compareTo(Device o) {
    return this.getDisplayName().compareToIgnoreCase(o.getDisplayName());
  }
}
