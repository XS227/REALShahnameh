import { getDateKey } from './progression.js';

function shuffle(array, random = Math.random) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

class LearningFlowEngine {
  constructor({ contentRepository, progressionManager, rewardLedger, random = Math.random } = {}) {
    this.contentRepository = contentRepository;
    this.progression = progressionManager;
    this.ledger = rewardLedger;
    this.random = random;
    this.language = null;
    this.payload = null;
    this.activeQuest = null;
    this.activeModule = null;
    this.activeContext = null;
    this.stepIndex = 0;
    this.sequenceState = null;
    this.awardedSteps = new Set();
  }

  async loadLanguage(language) {
    this.language = language;
    this.payload = await this.contentRepository.loadLanguage(language);
    this.resetActiveState();
    return this.payload;
  }

  getQuests() {
    return this.payload?.quests ?? [];
  }

  getDailyChallenge(date = new Date()) {
    if (!this.payload) return null;
    return this.contentRepository.getDailyChallenge(this.language, date) ?? null;
  }

  startQuest(questId, context = {}) {
    if (!this.payload) {
      throw new Error('Content not loaded');
    }
    const quest = this.payload.quests.find((item) => item.id === questId);
    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }
    const module = this.payload.modules.find((item) => item.id === quest.moduleId);
    if (!module) {
      throw new Error(`Module ${quest.moduleId} missing for quest ${questId}`);
    }
    this.activeQuest = quest;
    this.activeModule = module;
    this.activeContext = context;
    this.stepIndex = 0;
    this.sequenceState = null;
    this.awardedSteps.clear();
    return this.buildDescriptor(this.activeModule.steps[0]);
  }

  continue() {
    if (!this.activeModule) return null;
    this.stepIndex += 1;
    return this.buildDescriptor(this.activeModule.steps[this.stepIndex]);
  }

  answer(optionId) {
    const step = this.getCurrentStep();
    if (!step || step.type !== 'quiz') {
      throw new Error('Current step is not a quiz');
    }
    const option = Array.isArray(step.options) ? step.options.find((item) => item.id === optionId) : null;
    if (!option) {
      return { status: 'invalid', feedback: null };
    }
    const correct = option.correct === true;
    const stepId = this.resolveStepId(step.id);
    let nextDescriptor = null;
    let reward = null;
    if (correct) {
      if (!this.awardedSteps.has(stepId)) {
        this.awardedSteps.add(stepId);
        reward = this.applyReward(step.points ?? option.points ?? 0, {
          reason: 'quizStep',
          stepId,
          questId: this.activeQuest?.id,
          label: option.rewardLabel ?? step.rewardLabel ?? step.question,
        });
      }
      this.stepIndex += 1;
      nextDescriptor = this.buildDescriptor(this.activeModule.steps[this.stepIndex]);
    }
    return {
      status: correct ? 'correct' : 'incorrect',
      feedback: option.feedback ?? null,
      reward,
      nextStep: nextDescriptor,
    };
  }

  submitSequence(optionId) {
    const step = this.getCurrentStep();
    if (!step || step.type !== 'sequence') {
      throw new Error('Current step is not a sequence challenge');
    }
    if (!this.sequenceState) {
      this.sequenceState = {
        expected: step.sequence.map((item) => item.id),
        progress: [],
        selected: new Set(),
      };
    }
    if (this.sequenceState.selected.has(optionId)) {
      return { status: 'repeat', progress: this.sequenceState.progress.slice() };
    }
    const expectedId = this.sequenceState.expected[this.sequenceState.progress.length];
    if (optionId === expectedId) {
      this.sequenceState.progress.push(optionId);
      this.sequenceState.selected.add(optionId);
      if (this.sequenceState.progress.length === this.sequenceState.expected.length) {
        const stepId = this.resolveStepId(step.id);
        let reward = null;
        if (!this.awardedSteps.has(stepId)) {
          this.awardedSteps.add(stepId);
          reward = this.applyReward(step.points ?? 0, {
            reason: 'sequenceStep',
            stepId,
            questId: this.activeQuest?.id,
            label: step.rewardLabel ?? step.prompt,
          });
        }
        this.stepIndex += 1;
        const nextDescriptor = this.buildDescriptor(this.activeModule.steps[this.stepIndex]);
        return {
          status: 'complete',
          message: step.successMessage ?? null,
          reward,
          nextStep: nextDescriptor,
        };
      }
      return {
        status: 'progress',
        message: step.progressMessage ?? null,
        progress: this.sequenceState.progress.slice(),
      };
    }
    this.sequenceState.progress = [];
    this.sequenceState.selected.clear();
    return {
      status: 'reset',
      message: step.resetMessage ?? null,
      progress: [],
    };
  }

  completeQuest() {
    if (!this.activeQuest) return null;
    const questId = this.activeQuest.id;
    const questReward = this.applyQuestReward(this.activeQuest);
    const dailyResult = this.applyDailyBonus(questId, this.activeContext);
    const completionMessage = this.activeModule?.completion?.message ?? null;
    const summary = {
      type: 'complete',
      quest: this.activeQuest,
      completionMessage,
      questReward,
      dailyResult,
    };
    this.resetActiveState();
    return summary;
  }

  buildDescriptor(step) {
    if (!step) {
      return this.completeQuest();
    }
    if (step.type === 'story') {
      return {
        type: 'story',
        id: this.resolveStepId(step.id),
        headline: step.headline ?? this.activeModule?.title ?? '',
        body: Array.isArray(step.body) ? step.body : [step.body].filter(Boolean),
        cta: step.cta ?? 'Continue',
      };
    }
    if (step.type === 'quiz') {
      const options = Array.isArray(step.options)
        ? step.options.map((option) => ({
            ...option,
            id: option.id,
            correct: option.correct === true,
          }))
        : [];
      return {
        type: 'quiz',
        id: this.resolveStepId(step.id),
        question: step.question ?? '',
        context: Array.isArray(step.context) ? step.context : [step.context].filter(Boolean),
        options,
        allowRetry: step.allowRetry !== false,
        points: step.points ?? null,
        rewardLabel: step.rewardLabel ?? null,
      };
    }
    if (step.type === 'sequence') {
      const options = Array.isArray(step.options) ? shuffle(step.options, this.random) : [];
      this.sequenceState = {
        expected: Array.isArray(step.sequence) ? step.sequence.map((item) => item.id) : [],
        progress: [],
        selected: new Set(),
      };
      return {
        type: 'sequence',
        id: this.resolveStepId(step.id),
        prompt: step.prompt ?? '',
        options,
        points: step.points ?? 0,
        rewardLabel: step.rewardLabel ?? null,
        successMessage: step.successMessage ?? null,
        progressMessage: step.progressMessage ?? null,
        resetMessage: step.resetMessage ?? null,
      };
    }
    return null;
  }

  getCurrentStep() {
    return this.activeModule?.steps?.[this.stepIndex] ?? null;
  }

  resolveStepId(stepId) {
    if (stepId) return stepId;
    if (!this.activeModule) return `step-${this.stepIndex}`;
    return `${this.activeModule.id}-step-${this.stepIndex}`;
  }

  applyReward(points, meta = {}) {
    if (!this.progression) return null;
    const progress = this.progression.awardPoints(points, meta);
    if (!progress?.awarded) {
      return progress;
    }
    if (this.ledger) {
      const reward = this.ledger.registerReward(points, {
        ...meta,
        level: progress.level,
        xp: progress.xp,
      });
      return { ...progress, reward };
    }
    return progress;
  }

  applyQuestReward(quest) {
    if (!quest) return null;
    const result = this.progression
      ? this.progression.registerQuestCompletion(quest.id, quest.rewardPoints, {
          reason: 'questCompletion',
          questId: quest.id,
          label: quest.rewardLabel ?? quest.title,
        })
      : null;
    if (result?.awarded && this.ledger) {
      this.ledger.registerReward(quest.rewardPoints, {
        reason: 'questCompletion',
        questId: quest.id,
        label: quest.rewardLabel ?? quest.title,
        level: result.level,
        xp: result.xp,
      });
    }
    return result;
  }

  applyDailyBonus(questId, context = {}) {
    if (!this.progression || !context?.isDaily) {
      return null;
    }
    const dateKey = context.dateKey ?? getDateKey(context.date ?? new Date());
    const result = this.progression.completeDailyChallenge({
      dateKey,
      questId,
      bonusPoints: context.bonusPoints ?? 0,
    });
    if (result?.awarded && this.ledger) {
      this.ledger.registerReward(context.bonusPoints ?? 0, {
        reason: 'dailyBonus',
        questId,
        dateKey,
        streak: result.streak,
        level: result.level,
        xp: result.xp,
      });
    }
    return result;
  }

  resetActiveState() {
    this.activeQuest = null;
    this.activeModule = null;
    this.activeContext = null;
    this.stepIndex = 0;
    this.sequenceState = null;
    this.awardedSteps.clear();
  }
}

export { LearningFlowEngine, shuffle };
