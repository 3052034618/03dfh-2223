import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

interface SignaturePadProps {
  driverName: string
  signature: string
  onSign: (name: string, signature: string) => void
}

const SignaturePad: React.FC<SignaturePadProps> = ({ driverName, signature, onSign }) => {
  const handleSign = async () => {
    const name = driverName || '司机签字'

    try {
      Taro.showModal({
        title: '司机确认',
        content: '请司机在此确认以上验收信息无误，并电子签名确认',
        confirmText: '我确认',
        success: (res) => {
          if (res.confirm) {
            const mockSignature = 'https://picsum.photos/id/1025/600/300'
            onSign(name, mockSignature)
            Taro.showToast({
              title: '已确认',
              icon: 'success'
            })
          }
        }
      })
    } catch (error) {
      console.error('[SignaturePad] 签名失败', error)
    }
  }

  return (
    <View className={styles.container}>
      <Text className={styles.title}>司机确认</Text>
      
      <View className={styles.padArea}>
        {signature ? (
          <Image
            className={styles.signatureImg}
            src={signature}
            mode="aspectFit"
          />
        ) : (
          <Text className={styles.placeholder}>请司机签名确认</Text>
        )}
      </View>

      <View className={styles.actions}>
        {signature ? (
          <View
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => onSign('', '')}>
            <Text>重新签名</Text>
          </View>
        ) : (
          <View
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSign}>
            <Text>司机确认签字</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default SignaturePad
