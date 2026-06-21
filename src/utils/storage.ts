import Taro from '@tarojs/taro'
import type { ReceiptRecord } from '@/types/coldchain'

const STORAGE_KEYS = {
  RECEIPT_RECORDS: 'coldchain_receipt_records',
  USER_INFO: 'coldchain_user_info'
}

export const saveRecordsToStorage = (records: ReceiptRecord[]): void => {
  try {
    Taro.setStorageSync(STORAGE_KEYS.RECEIPT_RECORDS, JSON.stringify(records))
  } catch (e) {
    console.error('保存验收记录到本地失败', e)
  }
}

export const loadRecordsFromStorage = (): ReceiptRecord[] => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.RECEIPT_RECORDS)
    if (data) {
      return JSON.parse(data) as ReceiptRecord[]
    }
  } catch (e) {
    console.error('从本地加载验收记录失败', e)
  }
  return []
}

export const clearRecordsStorage = (): void => {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.RECEIPT_RECORDS)
  } catch (e) {
    console.error('清除本地验收记录失败', e)
  }
}

export const storage = {
  save: <T>(key: string, data: T): void => {
    try {
      Taro.setStorageSync(key, JSON.stringify(data))
    } catch (e) {
      console.error(`保存 ${key} 到本地失败`, e)
    }
  },

  load: <T>(key: string, defaultValue: T): T => {
    try {
      const data = Taro.getStorageSync(key)
      if (data) {
        return JSON.parse(data) as T
      }
    } catch (e) {
      console.error(`从本地加载 ${key} 失败`, e)
    }
    return defaultValue
  },

  remove: (key: string): void => {
    try {
      Taro.removeStorageSync(key)
    } catch (e) {
      console.error(`删除本地存储 ${key} 失败`, e)
    }
  }
}

export default storage
