
# Yet Another FHEM UI

## Installation instructions (for Christian)

### Prerequisites
- Java 1.7
- Maven 3.6.0
- The CORS attribute of your FHEMWEB device in FHEM must be set to 1.

### Installation
```
git clone https://github.com/dinos4711/yafu.git 

cd yafu

mvn package 

java -jar target/yafu-1.0-SNAPSHOT.jar
```

### Run
The last command starts yafu as a small web server at the machine on which the call was made. Open http://localhost:8090 (or whatever the machine name is on which yafu was started) in the web browser. In the shown dialog enter the URL of your FHEM installation, for example https://my-fhem.org:8083/fhem. Enter the user and password for the basic authentication. The proxy URL and password fields are optional. Press the Test button. If everything is Ok you can continue by pressing Ok.
