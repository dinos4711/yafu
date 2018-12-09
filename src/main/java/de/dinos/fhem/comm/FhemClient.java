package de.dinos.fhem.comm;

import de.dinos.fhem.config.Configuration;
import org.apache.http.Header;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.conn.socket.LayeredConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509ExtendedTrustManager;
import java.io.IOException;
import java.net.Socket;
import java.net.URLEncoder;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class FhemClient {

  private String baseURL = "";
  private String user;
  private String password;

  private HttpClient httpClient;

  public FhemClient() {
    try {

      String configString = Configuration.read();
      JSONObject config = new JSONObject(configString);
      String fhemHost = config.getString("fhemHost");
      String fhemUser = config.getString("fhemUser");
      String fhemPassword = config.getString("fhemPassword");
      String proxyHost = config.getString("proxyHost");
      String proxyPort = config.getString("proxyPort");
      construct(fhemHost, fhemUser, fhemPassword, proxyHost, proxyPort);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private void construct(String baseURL, String user, String password, String proxyHost, String proxyPort) {
    this.baseURL = baseURL;
    this.user = user;
    this.password = password;

    // Create a trust manager that does not validate certificate chains
    TrustManager[] trustAllCerts = new TrustManager[]{
        new X509ExtendedTrustManager() {
          @Override
          public void checkClientTrusted(X509Certificate[] x509Certificates, String s, Socket socket) throws CertificateException {

          }

          @Override
          public void checkServerTrusted(X509Certificate[] x509Certificates, String s, Socket socket) throws CertificateException {

          }

          @Override
          public void checkClientTrusted(X509Certificate[] x509Certificates, String s, SSLEngine sslEngine) throws CertificateException {

          }

          @Override
          public void checkServerTrusted(X509Certificate[] x509Certificates, String s, SSLEngine sslEngine) throws CertificateException {

          }

          public java.security.cert.X509Certificate[] getAcceptedIssuers() {
            return new X509Certificate[0];
          }

          public void checkClientTrusted(
              java.security.cert.X509Certificate[] certs, String authType) {
          }

          public void checkServerTrusted(
              java.security.cert.X509Certificate[] certs, String authType) {
          }
        }
    };

    LayeredConnectionSocketFactory sslSocketFactory = null;
    try {
      SSLContext sc = SSLContext.getInstance("TLSv1.2");
      sc.init(null, trustAllCerts, new java.security.SecureRandom());
      sslSocketFactory = new SSLConnectionSocketFactory(sc);
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    } catch (KeyManagementException e) {
      e.printStackTrace();
    }

    RequestConfig.Builder builder = RequestConfig.custom().setConnectTimeout(300 * 1000).setSocketTimeout(300 * 1000);
    if (proxyHost != null && !proxyHost.isEmpty()) {
      HttpHost proxy = new HttpHost(proxyHost, Integer.valueOf(proxyPort));
      builder.setProxy(proxy);
    }
    RequestConfig requestConfig = builder.build();
    httpClient = HttpClientBuilder.create().setSSLSocketFactory(sslSocketFactory).setDefaultRequestConfig(requestConfig).setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE).build();
  }

  public String getCsrfToken() throws IOException {
    HttpGet httpGet = new HttpGet(baseURL + "?XHR=1");
    httpGet.addHeader(BasicScheme.authenticate(
        new UsernamePasswordCredentials(user, password), "UTF-8", false));
    HttpResponse response = httpClient.execute(httpGet);
    Header tokenHeader = response.getFirstHeader("X-FHEM-csrfToken");
    return tokenHeader.getValue();
  }

  public Devices getDevices(String token) throws IOException {
    Devices devices = new Devices();

    HttpGet httpGet = new HttpGet(baseURL + "&XHR=1&fwcsrf=" + token + "&cmd=jsonlist2");
    httpGet.addHeader(BasicScheme.authenticate(
        new UsernamePasswordCredentials(user, password), "UTF-8", false));
    HttpResponse response = httpClient.execute(httpGet);
    String jSonString = EntityUtils.toString(response.getEntity());
    JSONObject jsonObject = new JSONObject(jSonString);
    JSONArray results = (JSONArray) jsonObject.get("Results");
    for (int idx = 0; idx < results.length(); idx++) {
      JSONObject oneResult = results.getJSONObject(idx);
      devices.add(Device.fromJSON(oneResult));
    }

    return devices;
  }

  public String getReading(String token, String device, String readingName) throws IOException {
    String cmd = "jsonlist2 " + device + " " + readingName;
    HttpGet httpGet = new HttpGet(baseURL + "&XHR=1&fwcsrf=" + token + "&cmd=" + URLEncoder.encode(cmd, "UTF-8"));
    httpGet.addHeader(BasicScheme.authenticate(
        new UsernamePasswordCredentials(user, password), "UTF-8", false));
    HttpResponse response = httpClient.execute(httpGet);
    String jSonString = EntityUtils.toString(response.getEntity());
    return jSonString;
  }

  public static void main(String[] args) throws IOException {
    FhemClient fhemClient = new FhemClient();

    String token = fhemClient.getCsrfToken();
    System.out.println(token);

    Devices devices = fhemClient.getDevices(token);
    System.out.println("---------------- DEVICES ----------------");
    for (Device device : devices) {
      System.out.println(device);
    }

    Set<String> rooms = devices.getRooms();
    for (String room : rooms) {
      System.out.println(room);
    }

    Set<String> deviceNames = devices.getDeviceNames();
    JSONArray names = new JSONArray();
    for (String deviceName : deviceNames) {
      names.put(deviceName);
    }
    System.out.println(names);

    Map<Device, Map<String, List<String>>> devicesWithSliders = devices.getDevicesWithPossibleSetters(2);

    for (Device device : devicesWithSliders.keySet()) {
      System.out.println("--------------------------");
      System.out.println(device.getDisplayName());
      Map<String, List<String>> stringListMap = devicesWithSliders.get(device);
      for (String setName : stringListMap.keySet()) {
        System.out.println("\t" + setName + " : " + stringListMap.get(setName));
      }
    }

    String reading = fhemClient.getReading(token, "HT_Kueche", "desiredTemperature");
    System.out.println(reading);

    Map<Device, Set<String>> devicesWithReadings = devices.getDevicesWithReadings();
    for (Device device : devicesWithReadings.keySet()) {
      System.out.println("--------------------------");
      System.out.println(device.getDisplayName());
      for (String readIng : device.getReadings()) {
        System.out.println("\t" + readIng);
      }
    }
  }

}
