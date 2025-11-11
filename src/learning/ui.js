import { LearningContentRepository } from './content.js';
import { createProgressionManager } from './progression.js';
import { createRewardLedger } from './rewards.js';
import { LearningFlowEngine } from './flow.js';

const LOCALES = {
  en: 'en-US',
  fa: 'fa-IR',
};

function initialiseFormatters(language) {
  const locale = LOCALES[language] ?? LOCALES.en;
  return {
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    token: new Intl.NumberFormat(locale, { maximumFractionDigits: 4, minimumFractionDigits: 2 }),
    dateTime: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
  };
}

function createButton(label, action, { questId, variant = 'primary', optionId } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `learning-button learning-button--${variant}`;
  button.textContent = label;
  button.dataset.learningAction = action;
  if (questId) button.dataset.learningQuestId = questId;
  if (optionId) button.dataset.learningOptionId = optionId;
  return button;
}

function initialiseLearningExperience({ translate, initialLanguage = 'en' } = {}) {
  const root = document.querySelector('[data-learning-root]');
  if (!root) {
    return {
      async setLanguage() {},
    };
  }

  const narrativeNode = root.querySelector('[data-learning-narrative]');
  const actionsNode = root.querySelector('[data-learning-actions]');
  const statusNode = root.querySelector('[data-learning-status]');
  const levelNode = root.querySelector('[data-learning-level]');
  const xpNode = root.querySelector('[data-learning-xp]');
  const nextNode = root.querySelector('[data-learning-next]');
  const streakNode = root.querySelector('[data-learning-streak]');
  const tokensNode = root.querySelector('[data-learning-tokens]');
  const rewardList = root.querySelector('[data-learning-reward-log]');
  const rewardEmpty = root.querySelector('[data-learning-reward-empty]');

  const repository = new LearningContentRepository();
  const progression = createProgressionManager();
  const ledger = createRewardLedger({ conversionRate: 0.05 });
  const flow = new LearningFlowEngine({
    contentRepository: repository,
    progressionManager: progression,
    rewardLedger: ledger,
  });

  let currentLanguage = initialLanguage;
  let formatters = initialiseFormatters(currentLanguage);
  let currentDescriptor = null;
  let pendingDailyContext = null;

  async function loadLanguage(language) {
    currentLanguage = language;
    formatters = initialiseFormatters(language);
    try {
      await flow.loadLanguage(language);
      renderHome();
      updateProgress();
      updateRewards();
    } catch (error) {
      console.error('Unable to load learning content', error);
      renderError();
    }
  }

  function clearStatus() {
    if (statusNode) {
      statusNode.textContent = '';
      statusNode.className = 'learning-feed__status';
    }
  }

  function setStatus(message, tone = 'neutral') {
    if (!statusNode || !message) return;
    statusNode.textContent = message;
    statusNode.className = `learning-feed__status learning-feed__status--${tone}`;
  }

  function renderHome() {
    currentDescriptor = null;
    pendingDailyContext = null;
    clearStatus();
    if (narrativeNode) {
      narrativeNode.innerHTML = '';
      const heading = document.createElement('h3');
      heading.textContent = translate('learningDailyChallengeTitle');
      narrativeNode.appendChild(heading);
      const daily = flow.getDailyChallenge(new Date());
      if (daily) {
        const summary = document.createElement('p');
        summary.className = 'learning-feed__summary';
        summary.textContent = `${daily.quest.title} — ${daily.quest.summary}`;
        narrativeNode.appendChild(summary);
        if (daily.bonusPoints) {
          const bonus = document.createElement('p');
          bonus.className = 'learning-feed__meta';
          bonus.textContent = translate('learningDailyBonusLabel', {
            points: formatters.integer.format(daily.bonusPoints),
          });
          narrativeNode.appendChild(bonus);
        }
        pendingDailyContext = {
          isDaily: true,
          bonusPoints: daily.bonusPoints,
          questId: daily.quest.id,
          dateKey: null,
        };
      } else {
        const empty = document.createElement('p');
        empty.className = 'learning-feed__summary';
        empty.textContent = translate('learningDailyChallengeFallback');
        narrativeNode.appendChild(empty);
      }

      const questHeading = document.createElement('h4');
      questHeading.className = 'learning-feed__subheading';
      questHeading.textContent = translate('learningQuestListHeading');
      narrativeNode.appendChild(questHeading);
      const questList = document.createElement('ul');
      questList.className = 'learning-feed__quest-list';
      flow.getQuests().forEach((quest) => {
        const li = document.createElement('li');
        li.textContent = `${quest.title} — ${quest.summary}`;
        questList.appendChild(li);
      });
      narrativeNode.appendChild(questList);
    }

    if (actionsNode) {
      actionsNode.innerHTML = '';
      const daily = pendingDailyContext;
      if (daily && daily.questId) {
        const dailyButton = createButton(
          translate('learningDailyChallengeCta'),
          'start-quest',
          { questId: daily.questId, variant: 'primary' },
        );
        dailyButton.dataset.learningDaily = 'true';
        actionsNode.appendChild(dailyButton);
      }
      flow.getQuests().forEach((quest) => {
        const variant = quest.id === pendingDailyContext?.questId ? 'secondary' : 'ghost';
        const button = createButton(
          translate('learningStartQuest', { title: quest.title }),
          'start-quest',
          { questId: quest.id, variant },
        );
        actionsNode.appendChild(button);
      });
    }
  }

  function renderError() {
    if (narrativeNode) {
      narrativeNode.innerHTML = '';
      const paragraph = document.createElement('p');
      paragraph.textContent = translate('learningContentError');
      narrativeNode.appendChild(paragraph);
    }
    if (actionsNode) {
      actionsNode.innerHTML = '';
      const retry = createButton(translate('learningRetry'), 'reload', { variant: 'primary' });
      actionsNode.appendChild(retry);
    }
  }

  function renderStory(descriptor) {
    if (!narrativeNode) return;
    narrativeNode.innerHTML = '';
    if (descriptor.headline) {
      const heading = document.createElement('h3');
      heading.textContent = descriptor.headline;
      narrativeNode.appendChild(heading);
    }
    descriptor.body.forEach((paragraphText) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = paragraphText;
      narrativeNode.appendChild(paragraph);
    });
    if (actionsNode) {
      actionsNode.innerHTML = '';
      const continueButton = createButton(descriptor.cta, 'continue', { variant: 'primary' });
      actionsNode.appendChild(continueButton);
    }
  }

  function renderQuiz(descriptor) {
    if (!narrativeNode) return;
    narrativeNode.innerHTML = '';
    const question = document.createElement('h3');
    question.textContent = descriptor.question;
    narrativeNode.appendChild(question);
    descriptor.context.forEach((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      narrativeNode.appendChild(paragraph);
    });
    if (actionsNode) {
      actionsNode.innerHTML = '';
      descriptor.options.forEach((option) => {
        const button = createButton(option.label, 'answer', {
          variant: 'primary',
          optionId: option.id,
        });
        actionsNode.appendChild(button);
      });
      const exit = createButton(translate('learningReturnHome'), 'return-home', { variant: 'ghost' });
      actionsNode.appendChild(exit);
    }
  }

  function renderSequence(descriptor) {
    if (!narrativeNode) return;
    narrativeNode.innerHTML = '';
    const prompt = document.createElement('h3');
    prompt.textContent = descriptor.prompt;
    narrativeNode.appendChild(prompt);
    if (actionsNode) {
      actionsNode.innerHTML = '';
      descriptor.options.forEach((option) => {
        const button = createButton(option.label, 'sequence', {
          optionId: option.id,
          variant: 'primary',
        });
        button.classList.add('learning-button--sequence');
        actionsNode.appendChild(button);
      });
      const exit = createButton(translate('learningReturnHome'), 'return-home', { variant: 'ghost' });
      actionsNode.appendChild(exit);
    }
  }

  function renderCompletion(summary) {
    if (!narrativeNode) return;
    narrativeNode.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = translate('learningQuestCompleteTitle', { title: summary.quest.title });
    narrativeNode.appendChild(title);
    if (summary.completionMessage) {
      const paragraph = document.createElement('p');
      paragraph.textContent = summary.completionMessage;
      narrativeNode.appendChild(paragraph);
    }
    if (summary.questReward?.awarded) {
      const reward = document.createElement('p');
      reward.className = 'learning-feed__meta';
      reward.textContent = translate('learningQuestReward', {
        points: formatters.integer.format(summary.questReward.points),
      });
      narrativeNode.appendChild(reward);
    }
    if (summary.dailyResult?.awarded) {
      const bonus = document.createElement('p');
      bonus.className = 'learning-feed__meta';
      bonus.textContent = translate('learningDailyComplete', {
        points: formatters.integer.format(summary.dailyResult.points),
        streak: formatters.integer.format(summary.dailyResult.streak),
      });
      narrativeNode.appendChild(bonus);
    }
    if (actionsNode) {
      actionsNode.innerHTML = '';
      const back = createButton(translate('learningReturnHome'), 'return-home', { variant: 'primary' });
      actionsNode.appendChild(back);
    }
    updateProgress();
    updateRewards();
  }

  function updateProgress() {
    const state = progression.getState();
    if (levelNode) levelNode.textContent = formatters.integer.format(state.level);
    if (xpNode) xpNode.textContent = formatters.integer.format(state.xp);
    if (nextNode) {
      nextNode.textContent = translate('learningNextLevelText', {
        xp: formatters.integer.format(Math.max(0, state.xpToNextLevel)),
      });
    }
    if (streakNode) {
      streakNode.textContent = translate('learningStreakValue', {
        count: formatters.integer.format(state.streak ?? 0),
      });
    }
  }

  function updateRewards() {
    const summary = ledger.getSummary();
    if (tokensNode) {
      tokensNode.textContent = formatters.token.format(summary.totalTokens);
    }
    if (!rewardList || !rewardEmpty) return;
    rewardList.innerHTML = '';
    if (!summary.history.length) {
      rewardEmpty.hidden = false;
      return;
    }
    rewardEmpty.hidden = true;
    summary.history.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'learning-reward__item';
      const meta = entry.meta ?? {};
      const description = meta.label ?? meta.reason ?? translate('learningRewardFallback');
      const timestamp = formatters.dateTime.format(new Date(entry.timestamp));
      li.innerHTML = `
        <span class="learning-reward__primary">${formatters.token.format(entry.tokens)} REAL</span>
        <span class="learning-reward__secondary">${description} — ${timestamp}</span>
      `;
      rewardList.appendChild(li);
    });
  }

  function handleAction(event) {
    const button = event.target.closest('[data-learning-action]');
    if (!button) return;
    const action = button.dataset.learningAction;
    if (action === 'start-quest') {
      const questId = button.dataset.learningQuestId;
      if (!questId) return;
      const isDaily = button.dataset.learningDaily === 'true';
      const context = isDaily
        ? {
            isDaily: true,
            bonusPoints: pendingDailyContext?.bonusPoints ?? 0,
            dateKey: null,
            date: new Date(),
          }
        : { isDaily: false };
      try {
        currentDescriptor = flow.startQuest(questId, context);
        clearStatus();
        renderDescriptor(currentDescriptor);
      } catch (error) {
        console.error(error);
        renderError();
      }
    } else if (action === 'continue') {
      currentDescriptor = flow.continue();
      renderDescriptor(currentDescriptor);
    } else if (action === 'answer') {
      const optionId = button.dataset.learningOptionId;
      if (!optionId) return;
      const result = flow.answer(optionId);
      if (result.status === 'incorrect') {
        setStatus(result.feedback ?? translate('learningQuizIncorrect'), 'error');
      } else if (result.status === 'correct') {
        renderDescriptor(result.nextStep);
        setStatus(result.feedback ?? translate('learningQuizCorrect'), 'success');
        updateProgress();
        updateRewards();
      }
    } else if (action === 'sequence') {
      const optionId = button.dataset.learningOptionId;
      if (!optionId) return;
      const result = flow.submitSequence(optionId);
      if (result.status === 'progress') {
        button.disabled = true;
        button.classList.add('learning-button--selected');
        setStatus(result.message ?? translate('learningSequenceProgress'), 'info');
      } else if (result.status === 'reset') {
        resetSequenceButtons();
        setStatus(result.message ?? translate('learningSequenceReset'), 'error');
      } else if (result.status === 'complete') {
        setStatus(result.message ?? translate('learningSequenceComplete'), 'success');
        updateProgress();
        updateRewards();
        renderDescriptor(result.nextStep);
      }
    } else if (action === 'return-home') {
      renderHome();
    } else if (action === 'reload') {
      loadLanguage(currentLanguage);
    }
  }

  function resetSequenceButtons() {
    if (!actionsNode) return;
    actionsNode.querySelectorAll('.learning-button--sequence').forEach((node) => {
      node.disabled = false;
      node.classList.remove('learning-button--selected');
    });
  }

  function renderDescriptor(descriptor) {
    clearStatus();
    if (!descriptor) {
      renderHome();
      return;
    }
    if (descriptor.type === 'story') {
      renderStory(descriptor);
      return;
    }
    if (descriptor.type === 'quiz') {
      renderQuiz(descriptor);
      return;
    }
    if (descriptor.type === 'sequence') {
      renderSequence(descriptor);
      return;
    }
    if (descriptor.type === 'complete') {
      renderCompletion(descriptor);
      return;
    }
    renderHome();
  }

  actionsNode?.addEventListener('click', handleAction);

  loadLanguage(initialLanguage);

  return {
    async setLanguage(language) {
      await loadLanguage(language);
    },
  };
}

export { initialiseLearningExperience };
