import React from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useReceiptStore } from '@/store/receipt'
import { formatDateTime } from '@/utils/format'

const WaybillPage: React.FC = () => {
  const waybillInfo = useReceiptStore(state => state.waybillInfo)
  const nextStep = useReceiptStore(state => state.nextStep)

  if (!waybillInfo) {
    Taro.showToast({
      title: '运单信息不存在',
      icon: 'none'
    })
    setTimeout(() => Taro.navigateBack(), 1500)
    return null
  }

  const handleNext = () => {
    nextStep()
    Taro.navigateTo({
      url: '/pages/temperature/index'
    })
  }

  return (
    <>
      <ScrollView scrollY className={styles.container}>
        <View className={styles.stepIndicator}>
          <View className={classnames(styles.stepItem, styles.done)}>
            <View className={classnames(styles.stepCircle, styles.done)}>✓</View>
            <Text className={styles.stepLabel}>运单信息</Text>
            <View className={styles.stepLine} />
          </View>
          <View className={classnames(styles.stepItem, styles.pending)}>
            <View className={classnames(styles.stepCircle, styles.pending)}>2</View>
            <Text className={styles.stepLabel}>温度验收</Text>
            <View className={styles.stepLine} />
          </View>
          <View className={classnames(styles.stepItem, styles.pending)}>
            <View className={classnames(styles.stepCircle, styles.pending)}>3</View>
            <Text className={styles.stepLabel}>收货确认</Text>
          </View>
        </View>

        <View className={styles.productBlock}>
          <Text className={styles.productName}>{waybillInfo.productName}</Text>
          <View className={styles.productMeta}>
            <View className={styles.metaBlock}>
              <Text className={styles.metaValue}>{waybillInfo.productCount}</Text>
              <Text className={styles.metaLabel}>数量（{waybillInfo.unit}）</Text>
            </View>
            <View className={styles.metaBlock}>
              <View className={styles.tempZoneBadge}>
                <Text className={styles.tempIcon}>❄️</Text>
                <Text>{waybillInfo.tempZoneLabel}</Text>
              </View>
              <Text className={styles.metaLabel}>约定温区</Text>
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>📋</Text>
            运单信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>运单号</Text>
            <Text className={styles.infoValue}>{waybillInfo.waybillNo}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>发货仓库</Text>
            <Text className={styles.infoValue}>{waybillInfo.warehouse}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>发货时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(waybillInfo.shippedAt)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计到达</Text>
            <Text className={styles.infoValue}>{formatDateTime(waybillInfo.estimatedArrival)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>实际到达</Text>
            <Text className={styles.infoValue}>{formatDateTime(waybillInfo.actualArrival)}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <Text className={styles.cardTitle}>
            <Text className={styles.titleIcon}>🚛</Text>
            承运信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>承运车辆</Text>
            <Text className={styles.infoValue}>{waybillInfo.vehicleNo}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>司机姓名</Text>
            <Text className={styles.infoValue}>{waybillInfo.driverName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoValue}>{waybillInfo.driverPhone}</Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.nextBtn} onClick={handleNext}>
          <Text>下一步：温度验收</Text>
        </View>
      </View>
    </>
  )
}

export default WaybillPage
