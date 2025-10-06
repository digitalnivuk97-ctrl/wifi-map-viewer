/**
 * OUI (Organizationally Unique Identifier) Lookup
 * Maps MAC address prefixes to manufacturer names
 */

// Simplified OUI database with common manufacturers
// Format: OUI prefix (first 6 hex chars) -> Manufacturer name
const OUI_DATABASE: Record<string, string> = {
  // Apple
  'F0EE7A': 'Apple, Inc.',
  '58AD12': 'Apple, Inc.',
  '60FDA6': 'Apple, Inc.',
  '80A997': 'Apple, Inc.',
  '348C5E': 'Apple, Inc.',
  '201582': 'Apple, Inc.',
  '40921A': 'Apple, Inc.',
  '10E2C9': 'Apple, Inc.',
  'A4FC14': 'Apple, Inc.',
  'A81AF1': 'Apple, Inc.',
  'CC08FA': 'Apple, Inc.',
  '909B6F': 'Apple, Inc.',
  '7473B4': 'Apple, Inc.',
  'B8144D': 'Apple, Inc.',
  'EC28D3': 'Apple, Inc.',
  '086518': 'Apple, Inc.',
  '2C57CE': 'Apple, Inc.',
  '308216': 'Apple, Inc.',
  '7C296F': 'Apple, Inc.',
  '40EDCF': 'Apple, Inc.',
  '8C986B': 'Apple, Inc.',
  '1C8682': 'Apple, Inc.',
  '8054E3': 'Apple, Inc.',
  'B067B5': 'Apple, Inc.',
  '5C5284': 'Apple, Inc.',
  'C0956D': 'Apple, Inc.',
  '3C39C8': 'Apple, Inc.',
  'A8ABB5': 'Apple, Inc.',
  '5864C4': 'Apple, Inc.',
  '98DD60': 'Apple, Inc.',
  'C04442': 'Apple, Inc.',
  'D468AA': 'Apple, Inc.',
  'F8C3CC': 'Apple, Inc.',
  'D8BE1F': 'Apple, Inc.',
  '98502E': 'Apple, Inc.',
  '580AD4': 'Apple, Inc.',
  'A477F3': 'Apple, Inc.',
  '088EDC': 'Apple, Inc.',
  'A84A28': 'Apple, Inc.',
  'B03F64': 'Apple, Inc.',
  '2C8217': 'Apple, Inc.',
  '142D4D': 'Apple, Inc.',
  'EC42CC': 'Apple, Inc.',
  'B8211C': 'Apple, Inc.',
  'C41234': 'Apple, Inc.',
  '3CA6F6': 'Apple, Inc.',
  '4CAB4F': 'Apple, Inc.',
  '9C583C': 'Apple, Inc.',
  'DC8084': 'Apple, Inc.',
  '80657C': 'Apple, Inc.',
  'BCD767': 'Apple, Inc.',
  
  // Samsung
  '641B2F': 'Samsung Electronics Co.,Ltd',
  '9C73B1': 'Samsung Electronics Co.,Ltd',
  '388A06': 'Samsung Electronics Co.,Ltd',
  '240935': 'Samsung Electronics Co.,Ltd',
  '80398C': 'Samsung Electronics Co.,Ltd',
  '980D6F': 'Samsung Electronics Co.,Ltd',
  '801970': 'Samsung Electronics Co.,Ltd',
  '30D587': 'Samsung Electronics Co.,Ltd',
  '388F30': 'Samsung Electronics Co.,Ltd',
  '1CAF4A': 'Samsung Electronics Co.,Ltd',
  'C8120B': 'Samsung Electronics Co.,Ltd',
  'D0D003': 'Samsung Electronics Co.,Ltd',
  '842289': 'Samsung Electronics Co.,Ltd',
  'C41C07': 'Samsung Electronics Co.,Ltd',
  '4011C3': 'Samsung Electronics Co.,Ltd',
  'C47D9F': 'Samsung Electronics Co.,Ltd',
  '5444A3': 'Samsung Electronics Co.,Ltd',
  'A0D7F3': 'Samsung Electronics Co.,Ltd',
  'DCCCE6': 'Samsung Electronics Co.,Ltd',
  'F065AE': 'Samsung Electronics Co.,Ltd',
  '48BCE1': 'Samsung Electronics Co.,Ltd',
  'BC455B': 'Samsung Electronics Co.,Ltd',
  
  // Huawei
  'E00630': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'D8DAF1': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '54443B': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '5C7075': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '782DAD': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'D06158': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '244BF1': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'F0A0B1': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '404F42': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '9CDBAF': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '0C2E57': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'E8D775': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '940EE7': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'A8B271': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '54C480': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'E8F9D4': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'B0C787': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '0C4F9B': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '482FD7': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '803C20': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'A4DD58': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'AC9073': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'FC1D3A': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'E4BEFB': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '58F8D7': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '2C9452': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '6001B1': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '24EBED': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'B0A4F0': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'C0060C': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '0CFC18': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'F828C9': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'FC1193': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '681BEF': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '1C3CD4': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'CCBCE3': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '3C93F4': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'AC5E14': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '20DF73': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '48128F': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '8415D3': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'D49400': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '604DE1': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '704E6B': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '603D29': 'HUAWEI TECHNOLOGIES CO.,LTD',
  '089E84': 'HUAWEI TECHNOLOGIES CO.,LTD',
  'ECA62F': 'HUAWEI TECHNOLOGIES CO.,LTD',
  
  // Cisco
  'E80AB9': 'Cisco Systems, Inc',
  '481BA4': 'Cisco Systems, Inc',
  '908855': 'Cisco Systems, Inc',
  '687161': 'Cisco Systems, Inc',
  '4CEC0F': 'Cisco Systems, Inc',
  '6C03B5': 'Cisco Systems, Inc',
  '5C64F1': 'Cisco Systems, Inc',
  'E8DC6C': 'Cisco Systems, Inc',
  '6887C6': 'Cisco Systems, Inc',
  '80248F': 'Cisco Systems, Inc',
  'D009C8': 'Cisco Systems, Inc',
  '44643C': 'Cisco Systems, Inc',
  '24161B': 'Cisco Systems, Inc',
  '806A00': 'Cisco Systems, Inc',
  '0845D1': 'Cisco Systems, Inc',
  '34B883': 'Cisco Systems, Inc',
  'ACBCD9': 'Cisco Systems, Inc',
  '4006D5': 'Cisco Systems, Inc',
  
  // Intel
  'E4C767': 'Intel Corporate',
  'A002A5': 'Intel Corporate',
  '102E00': 'Intel Corporate',
  '203A43': 'Intel Corporate',
  'C0A5E8': 'Intel Corporate',
  '906584': 'Intel Corporate',
  '28C5D2': 'Intel Corporate',
  '581CF8': 'Intel Corporate',
  'AC198E': 'Intel Corporate',
  'C85EA9': 'Intel Corporate',
  '8CF8C5': 'Intel Corporate',
  'A05950': 'Intel Corporate',
  'C43D1A': 'Intel Corporate',
  '04E8B9': 'Intel Corporate',
  'E02E0B': 'Intel Corporate',
  '10A51D': 'Intel Corporate',
  '507C6F': 'Intel Corporate',
  '088E90': 'Intel Corporate',
  '7C214A': 'Intel Corporate',
  '508492': 'Intel Corporate',
  '546CEB': 'Intel Corporate',
  '009337': 'Intel Corporate',
  '58CE2A': 'Intel Corporate',
  '847B57': 'Intel Corporate',
  'B03CDC': 'Intel Corporate',
  'F42679': 'Intel Corporate',
  'F44637': 'Intel Corporate',
  'A0E70B': 'Intel Corporate',
  
  // TP-Link
  '68DDB7': 'TP-LINK TECHNOLOGIES CO.,LTD.',
  '14D864': 'TP-LINK TECHNOLOGIES CO.,LTD.',
  'AC84C6': 'TP-LINK TECHNOLOGIES CO.,LTD.',
  '6CB158': 'TP-LINK TECHNOLOGIES CO.,LTD.',
  
  // Xiaomi
  'CCEB5E': 'Xiaomi Communications Co Ltd',
  'B8EA98': 'Xiaomi Communications Co Ltd',
  'F8AB82': 'Xiaomi Communications Co Ltd',
  'EC30B3': 'Xiaomi Communications Co Ltd',
  'DC6AE7': 'Xiaomi Communications Co Ltd',
  '7CA449': 'Xiaomi Communications Co Ltd',
  'BC6AD1': 'Xiaomi Communications Co Ltd',
  'D8B053': 'Xiaomi Communications Co Ltd',
  '6CF784': 'Xiaomi Communications Co Ltd',
  '081C6E': 'Xiaomi Communications Co Ltd',
  'F41A9C': 'Xiaomi Communications Co Ltd',
  '8CD0B2': 'Beijing Xiaomi Mobile Software Co., Ltd',
  'C8BF4C': 'Beijing Xiaomi Mobile Software Co., Ltd',
  'B850D8': 'Beijing Xiaomi Mobile Software Co., Ltd',
  
  // Google
  '60706C': 'Google, Inc.',
  'C82ADD': 'Google, Inc.',
  '242934': 'Google, Inc.',
  
  // Amazon
  '842859': 'Amazon Technologies Inc.',
  '2873F6': 'Amazon Technologies Inc.',
  'E0CB1D': 'Amazon Technologies Inc.',
  'FCD749': 'Amazon Technologies Inc.',
  '6C0C9A': 'Amazon Technologies Inc.',
  'E8D87E': 'Amazon Technologies Inc.',
  '0891A3': 'Amazon Technologies Inc.',
  'C08D51': 'Amazon Technologies Inc.',
  '44B4B2': 'Amazon Technologies Inc.',
  'ACCCFC': 'Amazon Technologies Inc.',
  'B4E454': 'Amazon Technologies Inc.',
  '0C43F9': 'Amazon Technologies Inc.',
  '446D7F': 'Amazon Technologies Inc.',
  '6C999D': 'Amazon Technologies Inc.',
  'E0F728': 'Amazon Technologies Inc.',
  '74D423': 'Amazon Technologies Inc.',
  'ECA138': 'Amazon Technologies Inc.',
  
  // Microsoft
  '70F8AE': 'Microsoft Corporation',
  '201642': 'Microsoft Corporation',
  'C461C7': 'Microsoft Corporation',
  'D8E2DF': 'Microsoft Corporation',
  
  // Dell
  'D0431E': 'Dell Inc.',
  '00C04F': 'Dell Inc.',
  '00B0D0': 'Dell Inc.',
  '0019B9': 'Dell Inc.',
  '001AA0': 'Dell Inc.',
  '002564': 'Dell Inc.',
  'A4BADB': 'Dell Inc.',
  '782BCB': 'Dell Inc.',
  '14FEB5': 'Dell Inc.',
  '180373': 'Dell Inc.',
  '74867A': 'Dell Inc.',
  '204747': 'Dell Inc.',
  '000BDB': 'Dell Inc.',
  '00123F': 'Dell Inc.',
  'A41F72': 'Dell Inc.',
  '001C23': 'Dell Inc.',
  '847BEB': 'Dell Inc.',
  '989096': 'Dell Inc.',
  '801844': 'Dell Inc.',
  '9840BB': 'Dell Inc.',
  'D481D7': 'Dell Inc.',
  '54BF64': 'Dell Inc.',
  'CCC5E5': 'Dell Inc.',
  '4CD98F': 'Dell Inc.',
  'DCF401': 'Dell Inc.',
  '6C2B59': 'Dell Inc.',
  'C8F750': 'Dell Inc.',
  '98E743': 'Dell Inc.',
  '185A58': 'Dell Inc.',
  'D08E79': 'Dell Inc.',
  'B44506': 'Dell Inc.',
  'E0D848': 'Dell Inc.',
  '04BF1B': 'Dell Inc.',
  
  // Espressif (ESP32/ESP8266)
  '10061C': 'Espressif Inc.',
  'D48AFC': 'Espressif Inc.',
  'E465B8': 'Espressif Inc.',
  '48E729': 'Espressif Inc.',
  '80646F': 'Espressif Inc.',
  '348518': 'Espressif Inc.',
  '94E686': 'Espressif Inc.',
  'B48A0A': 'Espressif Inc.',
  '1091A8': 'Espressif Inc.',
  '90380C': 'Espressif Inc.',
  '58CF79': 'Espressif Inc.',
  'C8C9A3': 'Espressif Inc.',
  '8C4B14': 'Espressif Inc.',
  'A848FA': 'Espressif Inc.',
  '34B472': 'Espressif Inc.',
  
  // Raspberry Pi
  'D83ADD': 'Raspberry Pi Trading Ltd',
  
  // Texas Instruments
  '40F3B0': 'Texas Instruments',
  '149CEF': 'Texas Instruments',
  '80C41B': 'Texas Instruments',
  '3468B5': 'Texas Instruments',
  '2CAB33': 'Texas Instruments',
  '28B5E8': 'Texas Instruments',
  '84C692': 'Texas Instruments',
  '6CB2FD': 'Texas Instruments',
  'D8B673': 'Texas Instruments',
  '3CE064': 'Texas Instruments',
  'E0928F': 'Texas Instruments',
  'CC037B': 'Texas Instruments',
  'A06C65': 'Texas Instruments',
  'FCA89B': 'Texas Instruments',
  '98F07B': 'Texas Instruments',
  
  // Ubiquiti
  'F09FC2': 'Ubiquiti Inc',
  '802AA8': 'Ubiquiti Inc',
  '788A20': 'Ubiquiti Inc',
  '7483C2': 'Ubiquiti Inc',
  'E063DA': 'Ubiquiti Inc',
  '245A4C': 'Ubiquiti Inc',
  '602232': 'Ubiquiti Inc',
  'E43883': 'Ubiquiti Inc',
  
  // Juniper
  'E4F27C': 'Juniper Networks',
  '60C78D': 'Juniper Networks',
  '84B59C': 'Juniper Networks',
  '5C4527': 'Juniper Networks',
  'EC3EF7': 'Juniper Networks',
  '002159': 'Juniper Networks',
  '00239C': 'Juniper Networks',
  '50C58D': 'Juniper Networks',
  '28C0DA': 'Juniper Networks',
  '288A1C': 'Juniper Networks',
  '40A677': 'Juniper Networks',
  'D818D3': 'Juniper Networks',
  'F04B3A': 'Juniper Networks',
  'C042D0': 'Juniper Networks',
  '001BC0': 'Juniper Networks',
  '44ECCE': 'Juniper Networks',
  'CCE194': 'Juniper Networks',
  'E45D37': 'Juniper Networks',
  '94F7AD': 'Juniper Networks',
  '784F9B': 'Juniper Networks',
  '88D98F': 'Juniper Networks',
  '78507C': 'Juniper Networks',
  'F07CC7': 'Juniper Networks',
  '000585': 'Juniper Networks',
  '889009': 'Juniper Networks',
  '00CC34': 'Juniper Networks',
  'E030F9': 'Juniper Networks',
  '204E71': 'Juniper Networks',
  'D404FF': 'Juniper Networks',
  '84C1C1': 'Juniper Networks',
  '4C734F': 'Juniper Networks',
  'D45A3F': 'Juniper Networks',
  '04698F': 'Juniper Networks',
  '7CE2CA': 'Juniper Networks',
  '485A0D': 'Juniper Networks',
  '3C08CD': 'Juniper Networks',
  
  // ZTE
  'F01B24': 'zte corporation',
  '98EE8C': 'zte corporation',
  '90C710': 'zte corporation',
  'DC5193': 'zte corporation',
  'F42E48': 'zte corporation',
  '203AEB': 'zte corporation',
  '301F48': 'zte corporation',
  'F43A7B': 'zte corporation',
  '689E29': 'zte corporation',
  '887B2C': 'zte corporation',
  'C4EBFF': 'zte corporation',
  '3CF9F0': 'zte corporation',
  '6877DA': 'zte corporation',
  '08E63B': 'zte corporation',
  '88C174': 'zte corporation',
  'CC29BD': 'zte corporation',
  '7890A2': 'zte corporation',
  'BCF88B': 'zte corporation',
  '3CA7AE': 'zte corporation',
  '5CBBEE': 'zte corporation',
  'D8A0E8': 'zte corporation',
  '103C59': 'zte corporation',
  '7426FF': 'zte corporation',
  'C42728': 'zte corporation',
  '34243E': 'zte corporation',
  '505D7A': 'zte corporation',
  '504289': 'zte corporation',
  'ACAD4B': 'zte corporation',
  
  // Nokia
  '286FB9': 'Nokia Shanghai Bell Co., Ltd.',
  '500238': 'Nokia Shanghai Bell Co., Ltd.',
  '90ECE3': 'Nokia',
  'B851A9': 'Nokia',
  '5C76D5': 'Nokia',
  '8C7A00': 'Nokia',
  '40A53B': 'Nokia',
  '78034F': 'Nokia',
  'F06C73': 'Nokia',
  'A4FF95': 'Nokia',
  '185B00': 'Nokia',
  
  // OPPO
  'E44097': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  'DCB4CA': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  'D4BAFA': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '74D558': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '9497AE': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '0CBD75': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  'BC64D9': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  'BCE8FA': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '24753A': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '2CFC8B': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '50874D': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  'B4205B': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '149BF3': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  '4C50F1': 'GUANGDONG OPPO MOBILE TELECOMMUNICATIONS CORP.,LTD',
  
  // Honor
  '0CB4CA': 'Honor Device Co., Ltd.',
  '2CB301': 'Honor Device Co., Ltd.',
  '40D4F6': 'Honor Device Co., Ltd.',
  '08E021': 'Honor Device Co., Ltd.',
  '68A7B4': 'Honor Device Co., Ltd.',
  '90FFD6': 'Honor Device Co., Ltd.',
  'C0280B': 'Honor Device Co., Ltd.',
  '9CEA97': 'Honor Device Co., Ltd.',
  'C89BAD': 'Honor Device Co., Ltd.',
  
  // Arista
  'FC59C0': 'Arista Networks',
  'C4CA2B': 'Arista Networks',
  
  // Meraki
  '9CE330': 'Cisco Meraki',
  'B4DF91': 'Cisco Meraki',
  'B8AB61': 'Cisco Meraki',
  '08F1B3': 'Cisco Meraki',
  
  // Netgear
  // Add Netgear entries if needed
  
  // D-Link
  'BC2228': 'D-Link International',
  
  // Linksys
  // Add Linksys entries if needed
  
  // Asus
  // Add Asus entries if needed
};

export class OUILookup {
  /**
   * Get manufacturer name from BSSID (MAC address)
   * @param bssid - MAC address in format XX:XX:XX:XX:XX:XX or XXXXXX
   * @returns Manufacturer name or "Unknown"
   */
  getManufacturer(bssid: string): string {
    if (!bssid) {
      return 'Unknown';
    }

    // Extract OUI prefix (first 6 hex characters)
    // Remove colons, hyphens, and dots
    const cleanBssid = bssid.replace(/[:\-\.]/g, '').toUpperCase();
    
    if (cleanBssid.length < 6) {
      return 'Unknown';
    }

    const oui = cleanBssid.substring(0, 6);
    
    return OUI_DATABASE[oui] || 'Unknown';
  }

  /**
   * Check if a manufacturer exists in the database
   * @param bssid - MAC address
   * @returns true if manufacturer is known
   */
  isKnownManufacturer(bssid: string): boolean {
    const cleanBssid = bssid.replace(/[:\-\.]/g, '').toUpperCase();
    if (cleanBssid.length < 6) {
      return false;
    }
    const oui = cleanBssid.substring(0, 6);
    return oui in OUI_DATABASE;
  }

  /**
   * Get the number of manufacturers in the database
   * @returns Count of manufacturers
   */
  getDatabaseSize(): number {
    return Object.keys(OUI_DATABASE).length;
  }
}

// Export singleton instance
export const ouiLookup = new OUILookup();
