import React, { useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import TempNodeCard from '@/components/TempNodeCard'
import { useReceiptStore } from '@/store/receipt'
import {
  getStatusLabel,
  formatTemp,
  formatDuration,
  getJudgeSuggestionLabel,
  getJudgeSuggestionColor
} from '@/utils/format'
import type { JudgeResult } from '@/types/coldchain'

const statusIconMap: Record<string, string> = {
  normal: '✅',
  warning: '⚠️',
  abnormal: '❌'
}

const statusDescMap: Record<string, string> = {
  normal: '全程冷链温度达标，货品状态良好',
  warning: '存在温度偏高时段，请结合异常详情判断',
  abnormal: '温度异常，建议联系主管确认是否收货'
}

const TemperaturePage: React.FC = () => {
  const tempNodes = useReceiptStore(state => state.tempNodes)
  const overallStatus = useReceiptStore(state => state.overallStatus)
  const waybillInfo = useReceiptStore(state => state.waybillInfo)
  const totalAbnormalMinutes = useReceiptStore(state => state.totalAbnormalMinutes)
  const generateJudgeSuggestion = useReceiptStore(state => state.generateJudgeSuggestion)
  const nextStep = useReceiptStore(state => state.nextStep)
  const prevStep = useReceiptStore(state => state.prevStep)

  const judgeResult = useMemo<JudgeResult>(() => {
    return generateJudgeSuggestion()
  }, [generateJudgeSuggestion])

  if (tempNodes.length === 0) {
    Taro.showToast({
      title: '温度数据不存在',
      icon: 'none'
    })
    setTimeout(() => Taro.navigateBack(), 1500)
    return null
  }

  const totalAbnormalCount = tempNodes.reduce((sum, node) => sum + node.abnormalCount, 0)
  const avgTemp = tempNodes.reduce((sum, node) => sum + node.avgTemp, 0) / tempNodes.length

  const handlePrev = () => {
    prevStep()
    Taro.navigateBack()
  }

  const handleNext = () => {
    nextStep()
    Taro.navigateTo({
      url: '/pages/conclusion/index'
    })
  }

  const getLevelClass = (level: string) => {
    if (level === 'success') return 'success'
    if (level === 'warning') return 'warning'
    return 'danger'
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
          <View className={classnames(styles.stepItem, styles.active)}>
            <View className={classnames(styles.stepCircle, styles.active)}>2</View>
            <Text className={styles.stepLabel}>温度验收</Text>
            <View className={styles.stepLine} />
          </View>
          <View className={classnames(styles.stepItem, styles.pending)}>
            <View className={classnames(styles.stepCircle, styles.pending)}>3</View>
            <Text className={styles.stepLabel}>收货确认</Text>
          </View>
        </View>

        <View className={classnames(styles.overallCard, styles[overallStatus])}>
          <Text className={styles.overallIcon}>{statusIconMap[overallStatus]}</Text>
          <Text className={styles.overallStatus}>{getStatusLabel(overallStatus)}</Text>
          <Text className={styles.overallDesc}>{statusDescMap[overallStatus]}</Text>
        </View>

        <View className={styles.overviewRow}>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{formatTemp(avgTemp)}</Text>
            <Text className={styles.overviewLabel}>全程平均温度</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text
              className={styles.overviewValue}
              style={{ color: totalAbnormalCount > 0 ? '#F53F3F' : '#00B42A' }}>
              {totalAbnormalCount}
            </Text>
            <Text className={styles.overviewLabel}>异常次数</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>
              {totalAbnormalMinutes > 0 ? formatDuration(totalAbnormalMinutes) : '0分钟'}
            </Text>
            <Text className={styles.overviewLabel}>累计异常时长</Text>
          </View>
          <View className={styles.overviewItem}>
            <Text className={styles.overviewValue}>{waybillInfo?.tempZoneLabel.split(' ')[0]}</Text>
            <Text className={styles.overviewLabel}>约定温区</Text>
          </View>
        </View>

        <View className={styles.legendRow}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.normal)} />
            <Text className={styles.legendText}>温度达标</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.warning)} />
            <Text className={styles.legendText}>温度偏高</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.abnormal)} />
            <Text className={styles.legendText}>温度异常</Text>
          </View>
        </View>

        <View
          className={classnames(
            styles.suggestionCard,
            styles[getLevelClass(judgeResult.level)]
          )}>
          <View className={styles.suggestionHeader}>
            <Text className={styles.suggestionIcon}>💡</Text>
            <View className={styles.suggestionTitleWrap}>
              <Text
                className={styles.suggestionTitle}
                style={{ color: getJudgeSuggestionColor(judgeResult.suggestion) }}>
                {getJudgeSuggestionLabel(judgeResult.suggestion)}
              </Text>
              <Text className={styles.suggestionSubtitle}>{judgeResult.title}</Text>
            </View>
          </View>
          <Text className={styles.suggestionDesc}>{judgeResult.description}</Text>
          <View className={styles.suggestionDetails}>
            {judgeResult.details.map((detail, index) => (
              <Text key={index} className={styles.suggestionDetail}>
                · {detail}
              </Text>
            ))}
          </View>
          <Text className={styles.suggestionTip}>
            * 以上为系统建议，请收货员结合货品外观检查后确认
          </Text>
        </View>

        <Text className={styles.sectionTitle}>分阶段温度记录</Text>

        {tempNodes.map(node => (
          <TempNodeCard key={node.type} node={node} />
        ))}
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={classnames(styles.btn, styles.btnSecondary)} onClick={handlePrev}>
          <Text>上一步</Text>
        </View>
        <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleNext}>
          <Text>下一步：确认收货</Text>
        </View>
      </View>
      </>
  )
}

export default TemperaturePage
