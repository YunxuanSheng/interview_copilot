# 音频格式转换指南

根据通义千问ASR的要求，音频文件必须满足以下条件：

## 官方要求

- **文件大小**：≤ 10MB
- **时长**：≤ 3分钟
- **采样率**：16kHz
- **声道**：单声道
- **格式**：支持 aac、amr、avi、aiff、flac、flv、m4a、mkv、mp3、mp4、mpeg、ogg、opus、wav、webm、wma、wmv

## 推荐格式

**MP3 或 WAV** - 兼容性最好

## 使用 FFmpeg 转换

### 安装 FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# 下载：https://ffmpeg.org/download.html
```

### 转换为标准 MP3（推荐）

```bash
ffmpeg -i input.m4a -ac 1 -ar 16000 -sample_fmt s16 -f mp3 output.mp3
```

参数说明：
- `-i input.m4a`: 输入文件
- `-ac 1`: 单声道
- `-ar 16000`: 16kHz采样率
- `-sample_fmt s16`: 16-bit采样格式
- `-f mp3`: 输出MP3格式
- `output.mp3`: 输出文件名

### 转换为标准 WAV

```bash
ffmpeg -i input.m4a -ac 1 -ar 16000 -sample_fmt s16 output.wav
```

### 裁剪长音频（超过3分钟）

```bash
# 从开始裁剪3分钟
ffmpeg -i long_audio.mp3 -t 00:03:00 -c copy clip.mp3

# 从1分30秒开始，裁剪2分钟
ffmpeg -i long_audio.mp3 -ss 00:01:30 -t 00:02:00 -c copy clip.mp3
```

### 压缩大文件

```bash
# 降低比特率以减小文件大小
ffmpeg -i input.mp3 -b:a 64k output.mp3
```

## 检查音频信息

```bash
# 查看音频详细信息
ffprobe -v error -show_entries format=format_name -show_entries stream=codec_name,sample_rate,channels -of default=noprint_wrappers=1 your_audio.mp3
```

## 常见问题

1. **文件格式不支持**：转换为MP3或WAV
2. **文件过大**：使用 `-b:a 64k` 降低比特率，或裁剪时长
3. **时长超过3分钟**：使用 `-t` 参数裁剪
4. **采样率不对**：使用 `-ar 16000` 设置为16kHz
5. **不是单声道**：使用 `-ac 1` 转换为单声道

