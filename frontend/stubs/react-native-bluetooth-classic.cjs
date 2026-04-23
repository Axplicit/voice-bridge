const stub = {
  getBondedDevices:     async () => [],
  connectToDevice:      async () => null,
  disconnectFromDevice: async () => null,
  startDiscovery:       async () => [],
  cancelDiscovery:      async () => null,
};

module.exports = stub;
module.exports.default = stub;

