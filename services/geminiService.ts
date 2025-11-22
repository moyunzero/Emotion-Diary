import { MoodEntry } from '../types';

// TODO: Fix Google Generative AI import issue and enable AI features
// For now, providing mock responses

export const generateReconciliationMessage = async (entry: MoodEntry): Promise<string> => {
  // Mock response for reconciliation message
  const responses = [
    "亲爱的，我们聊聊吧。刚才的事情我知道让你不开心了，但我真的很在乎你的感受。我们能不能好好沟通一下？🤔",
    "宝贝，对不起，我不应该那样对你说话。我真的很爱你，希望你能原谅我这一次。让我抱抱你好吗？💕",
    "亲爱的，我知道错了。当时我情绪上头了，但现在冷静下来想想，你说的都对。我们和好吧，好吗？😊",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const generateEmpathyPerspective = async (entry: MoodEntry): Promise<string> => {
  // Mock response for empathy perspective
  const responses = [
    "宝贝，我知道你生气了。其实我当时也没有想到会这样，我只是太累了，没有好好表达自己。我还是很爱你的...😔",
    "亲爱的，我知道你现在很委屈。其实我当时心里也很难受，只是不知道怎么说出来。谢谢你一直包容我...🥺",
    "宝贝，对不起让你受委屈了。我承认我当时做得不对，但我也很在乎这段感情。可以给我一次机会吗？😢",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const analyzeRelationshipHealth = async (entries: MoodEntry[]): Promise<string> => {
  // Mock analysis result
  const healthData = {
    mainIssue: "沟通方式需要改进",
    weather: "多云转晴",
    suggestion: "多一些耐心和理解，少一些指责"
  };
  
  return JSON.stringify(healthData);
};
