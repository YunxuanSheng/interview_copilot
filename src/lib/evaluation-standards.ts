// 面试评价标准配置
export interface EvaluationCriteria {
  technicalAccuracy: {
    description: string
    standards: {
      excellent: string
      good: string
      fair: string
      poor: string
    }
  }
  completeness: {
    description: string
    standards: {
      excellent: string
      good: string
      fair: string
      poor: string
    }
  }
  clarity: {
    description: string
    standards: {
      excellent: string
      good: string
      fair: string
      poor: string
    }
  }
  depth: {
    description: string
    standards: {
      excellent: string
      good: string
      fair: string
      poor: string
    }
  }
}

export const evaluationStandards: Record<string, EvaluationCriteria> = {
  // 算法问题评价标准
  algorithm: {
    technicalAccuracy: {
      description: "算法实现的正确性和时间复杂度分析",
      standards: {
        excellent: "算法实现完全正确，时间复杂度分析准确，能处理边界情况",
        good: "算法基本正确，时间复杂度分析基本准确，能处理大部分情况",
        fair: "算法思路正确但实现有误，时间复杂度分析不够准确",
        poor: "算法思路错误或实现完全错误"
      }
    },
    completeness: {
      description: "是否覆盖了问题的所有要求",
      standards: {
        excellent: "完全覆盖问题要求，包括边界情况、优化方案",
        good: "覆盖主要要求，考虑了部分边界情况",
        fair: "覆盖基本要求，但遗漏重要细节",
        poor: "只覆盖部分要求，遗漏关键点"
      }
    },
    clarity: {
      description: "思路表达和代码实现的清晰度",
      standards: {
        excellent: "思路清晰，代码结构良好，注释完整",
        good: "思路基本清晰，代码可读性较好",
        fair: "思路不够清晰，代码可读性一般",
        poor: "思路混乱，代码难以理解"
      }
    },
    depth: {
      description: "对算法原理和优化的理解深度",
      standards: {
        excellent: "深入理解算法原理，能提出多种优化方案",
        good: "理解算法原理，能提出基本优化",
        fair: "基本理解算法，优化思路有限",
        poor: "对算法理解浅显，缺乏优化思考"
      }
    }
  },

  // 系统设计问题评价标准
  systemDesign: {
    technicalAccuracy: {
      description: "技术选型和架构设计的合理性",
      standards: {
        excellent: "技术选型合理，架构设计符合最佳实践，考虑了扩展性",
        good: "技术选型基本合理，架构设计较为合理",
        fair: "技术选型有部分问题，架构设计不够完善",
        poor: "技术选型不当，架构设计有重大缺陷"
      }
    },
    completeness: {
      description: "系统设计的完整性和全面性",
      standards: {
        excellent: "设计全面，考虑了功能、性能、可扩展性、安全性等各个方面",
        good: "设计较为全面，考虑了主要方面",
        fair: "设计不够全面，遗漏重要方面",
        poor: "设计过于简单，遗漏多个重要方面"
      }
    },
    clarity: {
      description: "设计思路和方案的表达清晰度",
      standards: {
        excellent: "设计思路清晰，能画出清晰的架构图，表达准确",
        good: "设计思路基本清晰，能表达主要观点",
        fair: "设计思路不够清晰，表达有歧义",
        poor: "设计思路混乱，难以理解"
      }
    },
    depth: {
      description: "对系统设计原理和最佳实践的理解深度",
      standards: {
        excellent: "深入理解系统设计原理，能提出创新性解决方案",
        good: "理解系统设计原理，能应用最佳实践",
        fair: "基本理解系统设计，应用实践有限",
        poor: "对系统设计理解浅显，缺乏实践经验"
      }
    }
  },

  // 技术问题评价标准
  technical: {
    technicalAccuracy: {
      description: "技术概念和实现的准确性",
      standards: {
        excellent: "技术概念完全正确，实现方案可行且高效",
        good: "技术概念基本正确，实现方案可行",
        fair: "技术概念有部分错误，实现方案基本可行",
        poor: "技术概念错误，实现方案不可行"
      }
    },
    completeness: {
      description: "回答的完整性和全面性",
      standards: {
        excellent: "回答全面，覆盖了所有关键点，提供了具体示例",
        good: "回答较为全面，覆盖了主要点",
        fair: "回答不够全面，遗漏部分关键点",
        poor: "回答过于简单，遗漏多个关键点"
      }
    },
    clarity: {
      description: "表达的逻辑性和清晰度",
      standards: {
        excellent: "逻辑清晰，表达准确，易于理解",
        good: "逻辑基本清晰，表达较为准确",
        fair: "逻辑不够清晰，表达有歧义",
        poor: "逻辑混乱，表达不清楚"
      }
    },
    depth: {
      description: "技术理解的深度和广度",
      standards: {
        excellent: "理解深入，能联系相关技术，有独到见解",
        good: "理解较为深入，能联系部分相关技术",
        fair: "理解一般，联系相关技术有限",
        poor: "理解浅显，缺乏深度思考"
      }
    }
  },

  // 行为问题评价标准
  behavioral: {
    technicalAccuracy: {
      description: "经历描述的真实性和技术细节的准确性",
      standards: {
        excellent: "经历描述真实可信，技术细节准确具体",
        good: "经历描述基本真实，技术细节较为准确",
        fair: "经历描述不够具体，技术细节有模糊之处",
        poor: "经历描述不真实或技术细节错误"
      }
    },
    completeness: {
      description: "STAR方法的完整性和回答的全面性",
      standards: {
        excellent: "完整使用STAR方法，回答全面具体",
        good: "基本使用STAR方法，回答较为全面",
        fair: "STAR方法使用不完整，回答不够全面",
        poor: "未使用STAR方法，回答过于简单"
      }
    },
    clarity: {
      description: "表达的逻辑性和故事性",
      standards: {
        excellent: "表达逻辑清晰，故事生动，易于理解",
        good: "表达基本清晰，有一定的故事性",
        fair: "表达不够清晰，故事性不强",
        poor: "表达混乱，缺乏故事性"
      }
    },
    depth: {
      description: "对经历反思的深度和收获的总结",
      standards: {
        excellent: "反思深入，总结到位，有深刻的收获",
        good: "反思较为深入，总结基本到位",
        fair: "反思不够深入，总结一般",
        poor: "缺乏反思，总结不到位"
      }
    }
  }
}

// 生成专业评价反馈
export function generateProfessionalFeedback(
  questionType: string,
  evaluation: any,
  criteria: EvaluationCriteria
) {
  const feedback = {
    details: {} as Record<string, any>
  }

  // 生成各项详细评价
  Object.entries(criteria).forEach(([key, config]) => {
    const value = evaluation[key] || ""
    
    feedback.details[key] = {
      description: config.description,
      feedback: value
    }
  })

  return feedback
}
