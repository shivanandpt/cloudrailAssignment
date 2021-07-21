const {   OPCUAClient,
    MessageSecurityMode,
    SecurityPolicy,
    AttributeIds,
    makeBrowsePath,
    ClientSubscription,
    TimestampsToReturn,
    MonitoringParametersOptions,
    ReadValueIdOptions,
    ClientMonitoredItem,
    DataValue} = require("node-opcua");
const async = require("async");

const debug = require("debug")("client");
const chalk = require("chalk");


const endpointUrl = "opc.tcp://" + require("os").hostname() + ":4334/cloudRail/test";

const connectionStrategy = {
    initialDelay: 1000,
    maxRetry: 1
};

const client = OPCUAClient.create({
    applicationName: "MyClient",
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpoint_must_exist: false
});

async function main() {
    try {
        await client.connect(endpointUrl)
        debug(chalk.green("connected !"));

        const session = await client.createSession();
        debug(chalk.yellow("session created !"));

        const browseResult = await session.browse("RootFolder");

      
        for (const reference of browseResult.references) {
          debug("   -> ", chalk.yellow(reference.browseName.toString()));
        }

        let oldValue; 
        const subscription = ClientSubscription.create(session, {
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10
        });
          
          subscription
            .on("started", function() {
              debug(
                "subscription started for 2 seconds - subscriptionId=",
                chalk.yellow(subscription.subscriptionId)
              );
            })
            .on("keepalive", function() {
              debug("keepalive");
            })
            .on("terminated", function() {
              debug("terminated");
            });
          
          // install monitored item
          
          const itemToMonitor = {
            nodeId: "ns=1;b=1020FFAA",
            attributeId: AttributeIds.Value
          };
          const parameters = {
            samplingInterval: 100,
            discardOldest: true,
            queueSize: 10
          };
          
          const monitoredItem = ClientMonitoredItem.create(
            subscription,
            itemToMonitor,
            parameters,
            TimestampsToReturn.Both
          );
          
          monitoredItem.on("changed", (dataValue) => {
            if (!oldValue || dataValue.value > oldValue) {
              debug(" value has changed : ", chalk.green(dataValue.value.toString()));
            } else {
              debug(" value has changed : ", chalk.red(dataValue.value.toString()))
            }
            oldValue = dataValue.value
          });
          
          await timeout(10000);
          
          debug("now terminating subscription");
          await subscription.terminate();
          

        await session.close();
        debug("session closed !");

        await client.disconnect();
        debug("done !");
        
    } 
    catch(err) {
        debug("error", err);
    }
}

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main()

