/*
 * Copyright (c) 2024 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

type RNSensitiveInfoBiometryType = 'Touch ID' | 'Face ID';

type RNSensitiveInfoAccessControlOptions =
  | 'kSecAccessControlApplicationPassword'
  | 'kSecAccessControlPrivateKeyUsage'
  | 'kSecAccessControlDevicePasscode'
  | 'kSecAccessControlTouchIDAny'
  | 'kSecAccessControlTouchIDCurrentSet'
  | 'kSecAccessControlUserPresence'
  | 'kSecAccessControlBiometryAny'
  | 'kSecAccessControlBiometryCurrentSet';

type RNSensitiveInfoAttrAccessibleOptions =
  | 'kSecAttrAccessibleAfterFirstUnlock'
  | 'kSecAttrAccessibleAlways'
  | 'kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly'
  | 'kSecAttrAccessibleWhenUnlockedThisDeviceOnly'
  | 'kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly'
  | 'kSecAttrAccessibleAlwaysThisDeviceOnly'
  | 'kSecAttrAccessibleWhenUnlocked';

interface RNSensitiveInfoAndroidDialogStrings {
  header?: string;
  description?: string;
  hint?: string;
  success?: string;
  notRecognized?: string;
  cancel?: string;
  cancelled?: string;
}
export interface RNSensitiveInfoOptions {
    kSecAccessControl?: RNSensitiveInfoAccessControlOptions;
    kSecAttrAccessible?: RNSensitiveInfoAttrAccessibleOptions;
    kSecAttrSynchronizable?: boolean;
    keychainService?: string;
    sharedPreferencesName?: string;
    touchID?: boolean;
    showModal?: boolean;
    kSecUseOperationPrompt?: string;
    kLocalizedFallbackTitle?: string;
    strings?: RNSensitiveInfoAndroidDialogStrings;
  }
  interface SensitiveInfoEntry {
    key: string;
    value: string;
    service: string;
  }
export interface Spec extends TurboModule {
    setItem: (key: string,
        value: string,
        options: RNSensitiveInfoOptions) => Promise<null>;
    getItem: (key: string,
        options: RNSensitiveInfoOptions) => Promise<string>;
    hasItem(
      key: string,
      options: RNSensitiveInfoOptions,
    ): Promise<boolean>;
    getAllItems(
        options: RNSensitiveInfoOptions,
        ): Promise<[SensitiveInfoEntry[]]>;
    deleteItem(
        key: string,
        options: RNSensitiveInfoOptions,
        ): Promise<null>;
    isSensorAvailable(): Promise<
        RNSensitiveInfoBiometryType | boolean
      >;
    hasEnrolledFingerprints(): Promise<boolean>;
    cancelFingerprintAuth(): void;
    setInvalidatedByBiometricEnrollment(set: boolean): void;
} 
export default TurboModuleRegistry.get<Spec>('SensitiveInfoNativeModule') as Spec | null;