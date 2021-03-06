/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Firewalls {
  firewalls: {
    /**
     * Hostname/IP Address
     */
    hostname: string;
    /**
     * OPNSense API Auth
     */
    auth: {
      key: string;
      secret: string;
    };
  }[];
}
