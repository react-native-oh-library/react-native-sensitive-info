/**
 * MIT License
 *
 * Copyright (C) 2024 Huawei Device Co., Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import userAuth from '@ohos.userIAM.userAuth';
import dataPreferences from '@ohos.data.preferences';
import { BusinessError } from '@ohos.base';
import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import cryptoFramework from '@ohos.security.cryptoFramework';
import buffer from '@ohos.buffer';

import Logger from './Logger'
import { util } from '@kit.ArkTS';
import { tool } from './tools';

let preferences: dataPreferences.Preferences | null = null;
let tools = new tool()
const DEFAULT = 'default'
const UTF8 = 'utf-8'
let invalidateEnrollment = false;

const keyData = new Uint8Array([83, 217, 231, 76, 28, 113, 23, 219, 250, 71, 209, 210, 205, 97, 32, 159])

export class RNSensitiveInfoTurboModule extends TurboModule implements TM.SensitiveInfoNativeModule.Spec {
  constructor(ctx) {
    super(ctx);
  }

  stringToArray(str: string): Uint8Array {
    let textEncoder = new util.TextEncoder();
    return textEncoder.encodeInto(str);
  }

  setItem(key: string, value: string, options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): Promise<null> {
    return new Promise(async () => {
      let preferencesName: dataPreferences.Options = { name: this.sharedPreferences(options) };
      preferences = dataPreferences.getPreferencesSync(this.ctx.uiAbilityContext, preferencesName);
      let symKey = await tools.genSymKeyByData(keyData);
      let plainText: cryptoFramework.DataBlob = { data: new Uint8Array(buffer.from(value, UTF8).buffer) };
      let encryptText = await tools.encryptMessagePromise(symKey, plainText);
      preferences.put(key, encryptText.data, (err: BusinessError) => {
        if (err) {
          Logger.error("Failed to put value of 'startup'. code =" + err.code + ", message =" + err.message);
          return;
        }
        Logger.info("Succeeded in putting value of 'startup'.");
      })
      preferences.flush((err: BusinessError) => {
        if (err) {
          Logger.error("Failed to flush. code =" + err.code + ", message =" + err.message);
          return;
        }
        Logger.info("Succeeded in flushing.");
      })
    })
  }

  getItem(key: string, options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): Promise<string> {
    return new Promise((res) => {
      let preferencesName: dataPreferences.Options = { name: this.sharedPreferences(options) };
      preferences = dataPreferences.getPreferencesSync(this.ctx.uiAbilityContext, preferencesName);
      let decryptResult: string
      preferences.get(key, DEFAULT, async(err: BusinessError, val: Uint8Array) => {
        if (err) {
          Logger.error("Failed to get value of 'startup'. code =" + err.code + ", message =" + err.message);
          return;
        }
        let symKey = await tools.genSymKeyByData(keyData);
        let plainText: cryptoFramework.DataBlob = { data: val };
        let decryptText = await tools.decryptMessagePromise(symKey, plainText);
        if (decryptText.data) {
          decryptResult = buffer.from(decryptText.data).toString(UTF8)
          res(decryptResult)
        }
      })
    })
  }

  async decrypt(value: Uint8Array) {
    let symKey = await tools.genSymKeyByData(keyData);
    let decryptResult: string
    let plainText: cryptoFramework.DataBlob = { data: value };
    let decryptText = await tools.decryptMessagePromise(symKey, plainText);
    if (decryptText.data) {
      decryptResult = buffer.from(decryptText.data).toString(UTF8)
      return decryptResult
    }
  }

  hasItem(key: string, options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): Promise<boolean> {
    return new Promise(res => {
      let preferencesName: dataPreferences.Options = { name: this.sharedPreferences(options) };
      preferences = dataPreferences.getPreferencesSync(this.ctx.uiAbilityContext, preferencesName);
      preferences.has(key, (err: BusinessError, val: boolean) => {
        if (err) {
          Logger.error("Failed to check the key 'startup'. code =" + err.code + ", message =" + err.message);
          return;
        }
        if (val) { res(true) }
        else { res(false) }
      })
    })
  }

  getObjKeys(obj: Object): string[] {
    let keys = Object.keys(obj);
    return keys;
  }

  getAllItems(options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): Promise<unknown> {
    return new Promise((res) => {
      let preferencesName: dataPreferences.Options = { name: this.sharedPreferences(options) };
      preferences = dataPreferences.getPreferencesSync(this.ctx.uiAbilityContext, preferencesName);
      preferences.getAll(async (err: BusinessError, value: Object) => {
        if (err) {
          Logger.error("Failed to get all key-values. code =" + err.code + ", message =" + err.message);
          return;
        }
        let allKeys = this.getObjKeys(value);
        let newValues: Object = Object.create(null);
        for (const item of allKeys) {
          newValues[item] = await this.decrypt(value[item]); // 等待异步方法完成
        }
        console.info('key-values:',JSON.stringify(newValues) )
        res(newValues)
      })
    })
  }

  deleteItem(key: string, options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): Promise<unknown> {
    return new Promise(() => {
      let preferencesName: dataPreferences.Options = { name: this.sharedPreferences(options) };
      preferences = dataPreferences.getPreferencesSync(this.ctx.uiAbilityContext, preferencesName);
      preferences.delete(key, (err: BusinessError) => {
        if (err) {
          Logger.error("Failed to delete the key 'startup'. code =" + err.code + ", message =" + err.message);
          return;
        }
      })
    })
  }

  isSensorAvailable(): Promise<Object> {
    return new Promise((res) => {
      try {
        if (invalidateEnrollment){
          return
        }
        let userAuthInstance = userAuth.getUserAuthInstance(tools.authParam, tools.widgetParam);
        Logger.info('get userAuth instance success');
        userAuthInstance.start()
        Logger.info('auth start success');
        userAuthInstance.on('result', {
          onResult(result) {
            Logger.info('userAuthInstance callback result = ' + JSON.stringify(result));
            res(result)
          }
        });
      } catch (error) {
        res(error)
        Logger.error('auth catch error: ' + JSON.stringify(error));
      }
    })
  }

  hasEnrolledFingerprints(): Promise<boolean> {
    return new Promise((res) => {
      try {
        userAuth.getAvailableStatus(userAuth.UserAuthType.FINGERPRINT, userAuth.AuthTrustLevel.ATL1);
        Logger.info('current auth trust level is supported');
        res(true)
      } catch (error) {
        const err: BusinessError = error as BusinessError;
        res(false)
        Logger.info(`current auth trust level is not supported. Code is ${err?.code}, message is ${err?.message}`);
      }
    })
  }

  sharedPreferences(options: TM.SensitiveInfoNativeModule.RNSensitiveInfoOptions): string {
    let obj = Object.keys(options)
    let name: string =
      obj.indexOf("sharedPreferencesName") !== -1 ? options.sharedPreferencesName : "shared_preferences";
    if (name == null) {
      name = "shared_preferences";
    }
    return name;
  }

  cancelFingerprintAuth(): void {
    if (invalidateEnrollment){
      return
    }
    try {
      let userAuthInstance = userAuth.getUserAuthInstance(tools.authParam, tools.widgetParam);
      userAuthInstance.off('result', {
        onResult (result) {
          Logger.info('auth off result: ' + JSON.stringify(result));
        }
      });
      Logger.info('auth off success');
    } catch (error) {
      Logger.error('auth catch error: ' + JSON.stringify(error));
    }
  }

  setInvalidatedByBiometricEnrollment(set: boolean): void {
    invalidateEnrollment = set
  }
}