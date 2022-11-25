import * as path from 'path';
import { Construct } from 'constructs';
import {
  App, // https://developer.hashicorp.com/terraform/cdktf/api-reference/typescript#app
  TerraformStack, // https://developer.hashicorp.com/terraform/cdktf/api-reference/typescript#cdktf.TerraformStack
  TerraformOutput, // https://developer.hashicorp.com/terraform/cdktf/api-reference/typescript#terraformoutput
  Fn, // https://developer.hashicorp.com/terraform/cdktf/api-reference/typescript#fn
  TerraformAsset, // https://developer.hashicorp.com/terraform/cdktf/api-reference/typescript#terraformasset
} from 'cdktf';
import {
  provider,
  resourceGroup,
  virtualNetwork,
  networkSecurityGroup,
  networkSecurityRule,
  publicIp,
  subnet,
  subnetNetworkSecurityGroupAssociation,
  networkInterface,
  linuxVirtualMachine,
  dataAzurermPublicIp,
} from '@cdktf/provider-azurerm';

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // https://github.com/cdktf/cdktf-provider-azurerm
    new provider.AzurermProvider(this, 'azurerm', {
      // // https://stackoverflow.com/questions/45661109/are-azure-subscription-id-aad-tenant-id-and-aad-app-client-id-considered-secre
      // tenantId: '',
      // subscriptionId: '',
      features: {},
    });

    const azurermResourceGroupMtcRg = new resourceGroup.ResourceGroup(
      this,
      'mtc-rg',
      {
        location: 'eastus',
        name: 'mtc-resources',
        tags: {
          environment: 'dev',
        },
      },
    );

    const azurermVirtualNetworkMtcVn = new virtualNetwork.VirtualNetwork(
      this,
      'mtc-vn',
      {
        addressSpace: ['10.123.0.0/16'],
        location: azurermResourceGroupMtcRg.location,
        name: 'mtc-network',
        resourceGroupName: azurermResourceGroupMtcRg.name,
        tags: {
          environment: 'dev',
        },
      },
    );

    const azurermNetworkSecurityGroupMtcSg = new networkSecurityGroup.NetworkSecurityGroup(this, 'mtc-sg', {
      location: azurermResourceGroupMtcRg.location,
      name: 'mtc-sg',
      resourceGroupName: azurermResourceGroupMtcRg.name,
      tags: {
        environment: 'dev',
      },
    });

    new networkSecurityRule.NetworkSecurityRule(this, 'mtc-dev-rule', {
      access: 'Allow',
      destinationAddressPrefix: '*',
      destinationPortRange: '*',
      direction: 'Inbound',
      name: 'mtc-dev-rule',
      networkSecurityGroupName: azurermNetworkSecurityGroupMtcSg.name,
      priority: 100,
      protocol: '*',
      resourceGroupName: azurermResourceGroupMtcRg.name,
      sourceAddressPrefix: '*',
      sourcePortRange: '*',
    });

    const azurermPublicIpMtcIp = new publicIp.PublicIp(this, 'mtc-ip', {
      allocationMethod: 'Dynamic',
      location: azurermResourceGroupMtcRg.location,
      name: 'mtc-ip',
      resourceGroupName: azurermResourceGroupMtcRg.name,
      tags: {
        environment: 'dev',
      },
    });

    const azurermSubnetMtcSubnet = new subnet.Subnet(this, 'mtc-subnet', {
      addressPrefixes: ['10.123.1.0/24'],
      name: 'mtc-subnet',
      resourceGroupName: azurermResourceGroupMtcRg.name,
      virtualNetworkName: azurermVirtualNetworkMtcVn.name,
    });

    new subnetNetworkSecurityGroupAssociation.SubnetNetworkSecurityGroupAssociation(
      this,
      'mtc-sga',
      {
        networkSecurityGroupId: azurermNetworkSecurityGroupMtcSg.id,
        subnetId: azurermSubnetMtcSubnet.id,
      },
    );

    const azurermNetworkInterfaceMtcNic = new networkInterface.NetworkInterface(this, 'mtc-nic', {
      ipConfiguration: [
        {
          name: 'internal',
          privateIpAddressAllocation: 'Dynamic',
          publicIpAddressId: azurermPublicIpMtcIp.id,
          subnetId: azurermSubnetMtcSubnet.id,
        },
      ],
      location: azurermResourceGroupMtcRg.location,
      name: 'mtc-nic',
      resourceGroupName: azurermResourceGroupMtcRg.name,
      tags: {
        environment: 'dev',
      },
    });

    const vmInstallDockerAsset = new TerraformAsset(this, 'vm-install-docker-asset', {
      path: path.resolve(__dirname, 'install-docker-on-vm.sh'),
    });

    const azurermLinuxVirtualMachineMtcVm = new linuxVirtualMachine.LinuxVirtualMachine(this, 'mtc-vm', {
      adminSshKey: [
        {
          publicKey: Fn.file('~/.ssh/mtcazurekey.pub'),
          username: 'adminuser',
        },
      ],
      adminUsername: 'adminuser',
      customData: vmInstallDockerAsset.assetHash,
      location: azurermResourceGroupMtcRg.location,
      name: 'mtc-vm',
      networkInterfaceIds: [azurermNetworkInterfaceMtcNic.id],
      osDisk: {
        caching: 'ReadWrite',
        storageAccountType: 'Standard_LRS',
      },
      resourceGroupName: azurermResourceGroupMtcRg.name,
      size: 'Standard_B1s',
      sourceImageReference: {
        offer: 'UbuntuServer',
        publisher: 'Canonical',
        sku: '18.04-LTS',
        version: 'latest',
      },
      tags: {
        environment: 'dev',
      },
    });

    const addPublicIpToVsCodeRemoteAsset = new TerraformAsset(this, 'add-public-ip-to-vs-code-remote-asset', {
      path: path.resolve(__dirname, `${process.platform === 'win32' ? 'windows' : 'linux'}-ssh-script.tpl`),
    });

    azurermLinuxVirtualMachineMtcVm.provisioners = [
      {
        type: 'local-exec',
        command: Fn.templatefile(
          addPublicIpToVsCodeRemoteAsset.path,
          {
            hostname: azurermLinuxVirtualMachineMtcVm.publicIpAddress,
            user: 'adminuser',
            identityfile: '~/.ssh/mtcazurekey',
          },
        ),
        interpreter: process.platform === 'win32' ? ['powershell'] : ['bash', '-c'],
      },
    ];

    const dataAzurermPublicIpMtcIpData = new dataAzurermPublicIp.DataAzurermPublicIp(this, 'mtc-ip-data', {
      dependsOn: [azurermLinuxVirtualMachineMtcVm],
      name: azurermPublicIpMtcIp.name,
      resourceGroupName: azurermResourceGroupMtcRg.name,
    });

    new TerraformOutput(this, 'public_ip_address', {
      value: `${azurermLinuxVirtualMachineMtcVm.name}: ${dataAzurermPublicIpMtcIpData.ipAddress}`,
    });
  }
}

const app = new App();
new MyStack(app, 'cdktf-az-dev-env');
app.synth();
