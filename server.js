const { OPCUAServer, Variant, DataType, StatusCodes} = require("node-opcua");
const debug = require("debug")("server");
const chalk = require("chalk");
const port = 4334;
// Let's create an instance of OPCUAServer
(async () => {

    const server = new OPCUAServer({
        port, 
        resourcePath: "/cloudRail/test",
        buildInfo: {
            productName: "CloudRailServer",
            buildNumber: "1",
            buildDate: new Date()
        }
    });

    await server.initialize();
    debug(`initalize server with port ${chalk.green(port)}`);

    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    const device = namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: "MyDevice"
    });

    function tempForDHT22(min, max) {
        min = Math.ceil(min); // gives next greates 
        max = Math.floor(max); // gives equl or less  
        return (Math.random() * (max - min + 1) + min).toFixed(2); //The maximum is inclusive and the minimum is inclusive
    };
    let variable1 = tempForDHT22(-40, 80);
    setInterval(() => {  variable1 = tempForDHT22(-40, 80); }, 500);

    namespace.addVariable({
        componentOf: device,
        nodeId: "ns=1;b=1020FFAA",
        browseName: "MyVariable1",
        dataType: "Double",
        value: {
            get:  () => new Variant({dataType: DataType.Double, value: variable1 })
        }
    });
      
    server.start(function() {
        debug( chalk.yellow("Server is now listening ...") + chalk.red("( press CTRL+C to stop)"));
        debug(`port  ${chalk.green(server.endpoints[0].port)}`);
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        debug(`the primary server endpoint url is ${ chalk.green(endpointUrl)}`);
    });

})()
