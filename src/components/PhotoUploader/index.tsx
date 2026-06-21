import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxCount?: number
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos, onChange, maxCount = 6 }) => {
  const handleAdd = async () => {
    if (photos.length >= maxCount) {
      Taro.showToast({
        title: `最多上传${maxCount}张照片`,
        icon: 'none'
      })
      return
    }

    try {
      const res = await Taro.chooseImage({
        count: maxCount - photos.length,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })
      const newPhotos = [...photos, ...res.tempFilePaths]
      onChange(newPhotos)
    } catch (error) {
      console.error('[PhotoUploader] 选择图片失败', error)
    }
  }

  const handleDelete = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onChange(newPhotos)
  }

  return (
    <View className={styles.container}>
      {photos.map((photo, index) => (
        <View key={index} className={styles.photoItem}>
          <Image
            className={styles.photoImg}
            src={photo}
            mode="aspectFill"
            onClick={() => {
              Taro.previewImage({
                current: photo,
                urls: photos
              })
            }}
          />
          <View
            className={styles.deleteBtn}
            onClick={() => handleDelete(index)}>
            <Text>×</Text>
          </View>
        </View>
      ))}

      {photos.length < maxCount && (
        <View className={styles.addBtn} onClick={handleAdd}>
          <Text className={styles.addIcon}>+</Text>
          <Text className={styles.addText}>拍照/上传</Text>
        </View>
      )}
    </View>
  )
}

export default PhotoUploader
