import {
  ANALYSIS_METHODS,
  createAnalysisSettings,
  normalizeMethodWeights,
} from "@/lib/analysis/methodRegistry";
import type {
  AnalysisMethodId,
  AnalysisSettings,
  AIExecutionMeta,
  BranchMethodExplanation,
  DynamicTypeCode,
  ForkPath,
  IntegratedAnalysis,
  IntegratedInsight,
  MethodAnalysisResult,
  MethodContribution,
  SelfSkill,
  StagePersonalityAssessment,
} from "@/lib/types";

const METHOD_CONFIDENCE: Record<AnalysisMethodId, number> = {
  "user-evidence": 0.86,
  "behavioral-pattern": 0.68,
  "population-statistics": 0.58,
  "ai-synthesis": 0.56,
  "mbti-stage": 0.5,
  bazi: 0.32,
  ziwei: 0.3,
};

const METHOD_LIMITATIONS: Record<AnalysisMethodId, string> = {
  "user-evidence": "材料可能不完整，也会受到回忆偏差和选择性表达影响。",
  "behavioral-pattern": "从少量文本识别出的模式需要用户确认，不能视为稳定人格结论。",
  "population-statistics": "群体相关性不能直接推导个人结果，也不说明因果关系。",
  "ai-synthesis": "模型会生成合理但未经验证的假设，关键内容需要回到原始材料核对。",
  "mbti-stage": "这里只估计情境下的偏好倾向，不等同于官方 MBTI 测评或固定人格。",
  bazi: "八字属于传统文化解释体系，缺少可重复验证的个人预测证据。",
  ziwei: "紫微斗数属于传统文化解释体系，缺少可重复验证的个人预测证据。",
};

function enabledMethodIds(settings: AnalysisSettings): AnalysisMethodId[] {
  return settings.methods
    .filter((method) => method.enabled && method.weight > 0)
    .map((method) => method.id);
}

function contributionFor(
  methodId: AnalysisMethodId,
  settings: AnalysisSettings,
  evidenceIds: string[],
  rationale: string,
  confidenceOverride?: number,
): MethodContribution {
  const weights = normalizeMethodWeights(settings.methods);
  const confidence = confidenceOverride ?? METHOD_CONFIDENCE[methodId];
  return {
    methodId,
    methodLabel: ANALYSIS_METHODS[methodId].label,
    category: ANALYSIS_METHODS[methodId].category,
    userWeight: weights[methodId],
    confidence,
    contribution: Math.round(weights[methodId] * confidence * 10) / 10,
    evidenceIds,
    rationale,
    limitation: METHOD_LIMITATIONS[methodId],
  };
}

function buildMethodResults(
  skill: SelfSkill,
  settings: AnalysisSettings,
  culturalResults: MethodAnalysisResult[],
  modelExecution: AIExecutionMeta,
): MethodAnalysisResult[] {
  const culturalById = new Map(culturalResults.map((result) => [result.methodId, result]));
  const evidenceCoverage = Math.min(
    1,
    skill.evidence.length / Math.max(3, skill.claims.length),
  );

  return settings.methods.map((method) => {
    if (!method.enabled) {
      return {
        methodId: method.id,
        label: method.label,
        category: method.category,
        status: "disabled",
        summary: "用户没有启用该方法。",
        details: [],
        confidence: 0,
        inputQuality: 0,
        limitation: METHOD_LIMITATIONS[method.id],
      };
    }

    if (method.id === "bazi" || method.id === "ziwei") {
      return (
        culturalById.get(method.id) ?? {
          methodId: method.id,
          label: method.label,
          category: method.category,
          status: "missing-input",
          summary: "缺少出生日期、时间或处理同意。",
          details: [],
          confidence: 0,
          inputQuality: 0,
          limitation: METHOD_LIMITATIONS[method.id],
        }
      );
    }

    if (method.id === "user-evidence") {
      return {
        methodId: method.id,
        label: method.label,
        category: method.category,
        status: skill.evidence.length >= 3 ? "complete" : "limited",
        summary: `当前使用 ${skill.evidence.length} 条材料支持 ${skill.claims.length} 条主要判断。`,
        details: skill.evidence.slice(0, 5).map((item) => item.quote),
        confidence: METHOD_CONFIDENCE[method.id],
        inputQuality: evidenceCoverage,
        limitation: METHOD_LIMITATIONS[method.id],
      };
    }

    if (method.id === "behavioral-pattern") {
      return {
        methodId: method.id,
        label: method.label,
        category: method.category,
        status: "complete",
        summary: `识别到 ${skill.semantic.recurringPatterns.length} 个需要用户确认的重复模式。`,
        details: skill.semantic.recurringPatterns.slice(0, 5),
        confidence: METHOD_CONFIDENCE[method.id],
        inputQuality: Math.min(1, evidenceCoverage + 0.08),
        limitation: METHOD_LIMITATIONS[method.id],
      };
    }

    if (method.id === "population-statistics") {
      return {
        methodId: method.id,
        label: method.label,
        category: method.category,
        status: "limited",
        summary: "当前版本只提供通用基准，尚未接入行业、地区和年龄分层数据集。",
        details: [
          "用于检查方案是否忽略常见风险",
          "不会直接给出个人成功率",
          "后续需为每个统计结论绑定数据集和样本信息",
        ],
        references: [
          {
            id: "big-five-mega-analysis",
            title: "Big Five 与生活结果的元分析综述",
            url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8867745/",
            note: "用于说明群体层面的性格相关性；不能直接推导个人未来。",
          },
        ],
        confidence: METHOD_CONFIDENCE[method.id],
        inputQuality: 0.42,
        limitation: METHOD_LIMITATIONS[method.id],
      };
    }

    if (method.id === "ai-synthesis") {
      const providerReference =
        modelExecution.provider === "openai"
          ? {
              id: "openai-data-controls",
              title: "OpenAI API 数据控制说明",
              url: "https://developers.openai.com/api/docs/guides/your-data",
              note: "用于说明本次模型请求的数据处理边界。",
            }
          : modelExecution.provider === "deepseek"
            ? {
                id: "deepseek-api-docs",
                title: "DeepSeek API 官方文档",
                url: "https://api-docs.deepseek.com/",
                note: "用于核对本次模型提供商和接口能力；数据政策需按部署协议另行确认。",
              }
            : null;
      return {
        methodId: method.id,
        label: method.label,
        category: method.category,
        status: modelExecution.used ? "complete" : "limited",
        summary: modelExecution.used
          ? `服务器模型已参与材料整理和方案生成：${modelExecution.provider} / ${modelExecution.model}。`
          : `本次使用本地规则生成，服务器模型未参与${
              modelExecution.fallbackReason
                ? `（${modelExecution.fallbackReason}）`
                : ""
            }。`,
        details: [
          `当前核心冲突：${skill.semantic.innerConflict}`,
          `当前决策方式：${skill.decision.riskPreference}`,
        ],
        references: providerReference ? [providerReference] : [],
        confidence: modelExecution.used ? METHOD_CONFIDENCE[method.id] : 0.35,
        inputQuality: evidenceCoverage,
        limitation: METHOD_LIMITATIONS[method.id],
      };
    }

    return {
      methodId: method.id,
      label: method.label,
      category: method.category,
      status: skill.dynamicTypeProfile ? "complete" : "limited",
      summary: skill.dynamicTypeProfile
        ? `当前倾向为 ${skill.dynamicTypeProfile.currentTendency.label}，会随情境和阶段变化。`
        : "当前根据文本进行初步估计，需要更多阶段材料确认。",
      details: skill.dynamicTypeProfile
        ? Object.values(skill.dynamicTypeProfile.dimensions).map(
            (dimension) =>
              `${dimension.dimension}：${dimension.tendency} 倾向，参考度 ${Math.round(dimension.confidence * 100)}%`,
          )
        : ["只用于自我反思", "不能用于招聘、筛选或能力判断"],
      references: [
        {
          id: "mbti-code-of-ethics",
          title: "MBTI 官方使用伦理规范",
          url: "https://www.myersbriggs.org/using-type-as-a-professional/mbti-code-of-ethics/home.htm",
          note: "强调类型表示倾向、允许用户不同意，并避免用单一类型做重大决定。",
        },
      ],
      confidence: METHOD_CONFIDENCE[method.id],
      inputQuality: skill.dynamicTypeProfile ? 0.66 : 0.38,
      limitation: METHOD_LIMITATIONS[method.id],
    };
  });
}

function buildInsights(
  skill: SelfSkill,
  settings: AnalysisSettings,
  culturalResults: MethodAnalysisResult[],
): IntegratedInsight[] {
  const enabled = new Set(enabledMethodIds(settings));
  const baseMethods = (["user-evidence", "behavioral-pattern", "ai-synthesis"] as const).filter(
    (methodId) => enabled.has(methodId),
  );

  const claimInsights = skill.claims.slice(0, 5).map((claim, index) => ({
    id: `insight-${index + 1}`,
    title: index === 0 ? "当前最重要的判断" : `判断 ${index + 1}`,
    summary: claim.text,
    kind: "observation" as const,
    confidence: claim.confidence,
    evidenceIds: claim.evidenceIds,
    methodContributions: baseMethods.map((methodId) =>
      contributionFor(
        methodId,
        settings,
        claim.evidenceIds,
        methodId === "user-evidence"
          ? "该判断直接链接到用户提供的材料。"
          : methodId === "behavioral-pattern"
            ? "该判断与多处重复出现的选择和情绪模式一致。"
            : "服务器模型或本地规则对材料进行了综合。",
        methodId === "ai-synthesis" ? Math.min(claim.confidence, 0.62) : undefined,
      ),
    ),
    userCanDisagree: true as const,
  }));

  const culturalInsights = culturalResults
    .filter(
      (result) =>
        result.status === "complete" &&
        enabled.has(result.methodId) &&
        (result.methodId === "bazi" || result.methodId === "ziwei"),
    )
    .map((result) => ({
      id: `insight-${result.methodId}`,
      title: `${result.label}提供的文化视角`,
      summary: result.summary,
      kind: "cultural-reading" as const,
      confidence: result.confidence,
      evidenceIds: [],
      methodContributions: [
        contributionFor(
          result.methodId,
          settings,
          [],
          "该内容由传统排盘规则生成，未用于替代现实证据。",
          result.confidence,
        ),
      ],
      userCanDisagree: true as const,
    }));

  return [...claimInsights, ...culturalInsights];
}

function buildStagePersonality(
  skill: SelfSkill,
  settings: AnalysisSettings,
): StagePersonalityAssessment[] {
  const enabled = enabledMethodIds(settings).includes("mbti-stage");
  if (!enabled) return [];

  const stageTypes = skill.dynamicTypeProfile?.stageTypes ?? [];
  if (stageTypes.length) {
    return stageTypes.slice(0, 6).map((stage, index) => ({
      id: stage.id,
      stageLabel: stage.label,
      ageRange: stage.context.timeLabel ?? stage.label,
      type: stage.type,
      confidence: stage.confidence,
      source: index < Math.max(1, stageTypes.length - 2) ? "retrospective" : "scenario",
      description: stage.evidenceHint,
      changeDrivers: [stage.context.note],
      methodContributions: [
        contributionFor(
          "mbti-stage",
          settings,
          stage.evidenceIds,
          "根据该阶段的表达、压力状态和选择方式估计偏好倾向。",
          stage.confidence,
        ),
      ],
    }));
  }

  const fallbackTypes: DynamicTypeCode[] = ["INFP", "INTP", "ENFP"];
  return skill.timeline.slice(0, 4).map((node, index) => ({
    id: `stage-${node.id}`,
    stageLabel: node.yearLabel,
    ageRange: node.yearLabel,
    type: fallbackTypes[index % fallbackTypes.length],
    confidence: 0.36,
    source: node.yearLabel === "未来" ? "scenario" : "retrospective",
    description: `${node.title}阶段的初步偏好估计，需要用户确认。`,
    changeDrivers: [node.emotion, node.pattern],
    methodContributions: [
      contributionFor(
        "mbti-stage",
        settings,
        [],
        "当前缺少正式量表，只根据阶段描述进行低置信度估计。",
        0.36,
      ),
    ],
  }));
}

function buildBranchExplanations(
  skill: SelfSkill,
  settings: AnalysisSettings,
): BranchMethodExplanation[] {
  const branches = skill.forks
    .flatMap((root) => {
      const queue = [root];
      const nodes: ForkPath[] = [];
      while (queue.length && nodes.length < 200) {
        const node = queue.shift();
        if (!node) break;
        nodes.push(node);
        if (node.children?.length) queue.push(...node.children);
      }
      return nodes;
    })
    .filter((branch, index, all) => all.findIndex((item) => item.id === branch.id) === index);
  const enabled = enabledMethodIds(settings);

  return branches.map((branch, index) => {
    const evidenceIds = skill.evidence.slice(0, 3).map((item) => item.id);
    const methodContributions = enabled.map((methodId) =>
      contributionFor(
        methodId,
        settings,
        methodId === "bazi" || methodId === "ziwei" ? [] : evidenceIds,
        methodId === "population-statistics"
          ? "用于检查常见执行风险，当前没有给出个人概率。"
          : methodId === "bazi" || methodId === "ziwei"
            ? "只提供传统文化视角，分支评分仍以现实材料为主。"
            : "用于比较该方案与用户目标、顾虑和现有资源的匹配程度。",
      ),
    );
    const contributionTotal = methodContributions.reduce(
      (sum, contribution) => sum + contribution.contribution,
      0,
    );

    return {
      branchId: branch.id,
      branchTitle: branch.title,
      score: Math.max(38, Math.min(88, Math.round(contributionTotal + 10 - index * 3))),
      summary: branch.summary,
      methodContributions,
      assumptions: [
        "用户提供的信息在当前阶段仍然有效",
        "方案成本没有出现重大外部变化",
        "用户可以获得至少一次现实反馈",
      ],
      unknowns: [
        "外部环境变化",
        "相关人的真实反应",
        "执行过程中新增的信息和资源",
      ],
    };
  });
}

export function buildIntegratedAnalysis({
  skill,
  settings = skill.analysisSettings ?? createAnalysisSettings(),
  culturalResults = [],
  modelExecution = {
    used: false,
    provider: "local",
    model: "local-rules",
  },
}: {
  skill: SelfSkill;
  settings?: AnalysisSettings;
  culturalResults?: MethodAnalysisResult[];
  modelExecution?: AIExecutionMeta;
}): IntegratedAnalysis {
  const enabledCount = settings.methods.filter((method) => method.enabled).length;
  const evidenceFactor = Math.min(1, skill.evidence.length / 5);
  const materialFactor = Math.min(1, (skill.extraText?.length ?? 0) / 600);
  const dataCompleteness = Math.round(
    Math.min(1, 0.28 + evidenceFactor * 0.42 + materialFactor * 0.2 + enabledCount * 0.015) *
      100,
  );

  return {
    schemaVersion: "integrated-analysis.v1",
    generatedAt: new Date().toISOString(),
    preset: settings.preset,
    dataCompleteness,
    modelExecution,
    normalizedWeights: normalizeMethodWeights(settings.methods),
    insights: buildInsights(skill, settings, culturalResults),
    stagePersonality: buildStagePersonality(skill, settings),
    methodResults: buildMethodResults(
      skill,
      settings,
      culturalResults,
      modelExecution,
    ),
    branchExplanations: buildBranchExplanations(skill, settings),
    limitations: [
      "所有结论都依赖当前输入，材料变化后应重新生成。",
      "分支分数用于比较信息完整度和目标匹配度，不代表未来发生概率。",
      "MBTI 只表达阶段性偏好倾向。",
      "八字与紫微斗数属于文化解释方法，默认低权重。",
      "重大医疗、法律、财务和人身安全决定需要咨询具备资质的专业人士。",
    ],
  };
}
