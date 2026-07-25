import { useState, useEffect } from 'react';
import { DraftPrompt, ComplexityLevel, VisualStyle, Language, AspectRatio, SavedCampaign, SocialPostCampaignItem, CarouselSlide } from '../../types';
import { generateSocialCampaign, generateSingleSocialPost, refineSingleSocialPost } from '../../services/geminiService';
import { DBService } from '../../services/dbService';

interface UseCampaignsProps {
  activeProjectId: string;
  onCreateDraft: (draft: Omit<DraftPrompt, 'id' | 'createdAt'>) => void;
  onLaunchDraft: (draft: DraftPrompt) => void;
}

export const useCampaigns = ({ activeProjectId, onCreateDraft, onLaunchDraft }: UseCampaignsProps) => {
  // New Campaign Project State
  const [newCampName, setNewCampName] = useState('');
  const [newCampWebsite, setNewCampWebsite] = useState('');
  const [newCampTopic, setNewCampTopic] = useState('');
  const [newCampPlatform, setNewCampPlatform] = useState('Instagram');
  const [newCampPostCount, setNewCampPostCount] = useState(5);
  const [newCampStyleGuide, setNewCampStyleGuide] = useState('');
  const [newCampAspect, setNewCampAspect] = useState<AspectRatio>('9:16');
  const [newCampStyle, setNewCampStyle] = useState<VisualStyle>('Default');
  const [startMethod, setStartMethod] = useState<'ai' | 'empty'>('ai');
  const [newCampTemplate, setNewCampTemplate] = useState<string>('');

  // Active Campaign Workspace State
  const [campaignPosts, setCampaignPosts] = useState<SocialPostCampaignItem[] | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] = useState('');

  // Persisted Social Campaigns State
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>(() => {
    const stored = localStorage.getItem('infogenius_saved_campaigns');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse saved campaigns", e);
      }
    }
    return [];
  });

  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(() => {
    return localStorage.getItem('infogenius_active_campaign_id');
  });

  // Campaign Renaming States
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');

  // Editing state for campaign posts
  const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editVisualPrompt, setEditVisualPrompt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editStyle, setEditStyle] = useState<VisualStyle>('Default');
  const [editAspect, setEditAspect] = useState<AspectRatio>('9:16');

  // Manual Post adding state
  const [manualPostTitle, setManualPostTitle] = useState('');
  const [manualPostPrompt, setManualPostPrompt] = useState('');
  const [manualPostCaption, setManualPostCaption] = useState('');
  const [manualPostHashtags, setManualPostHashtags] = useState('');
  const [manualPostStyle, setManualPostStyle] = useState<VisualStyle>('Default');
  const [manualPostAspect, setManualPostAspect] = useState<AspectRatio>('9:16');

  // Single AI Post generator state
  const [showSingleAIPostForm, setShowSingleAIPostForm] = useState(false);
  const [singlePostInstruction, setSinglePostInstruction] = useState('');
  const [isGeneratingSinglePost, setIsGeneratingSinglePost] = useState(false);

  // Refinement / Chat Assistant State
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Copy success notification state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<'prompt' | 'caption' | null>(null);

  // Synchronize savedCampaigns to localStorage
  useEffect(() => {
    localStorage.setItem('infogenius_saved_campaigns', JSON.stringify(savedCampaigns));
  }, [savedCampaigns]);

  // Synchronize activeCampaignId to localStorage
  useEffect(() => {
    if (activeCampaignId) {
      localStorage.setItem('infogenius_active_campaign_id', activeCampaignId);
    } else {
      localStorage.removeItem('infogenius_active_campaign_id');
    }
  }, [activeCampaignId]);

  // Migrate large base64 images from localStorage to IndexedDB on mount
  useEffect(() => {
    const migrateCampaigns = async () => {
      let migratedAny = false;
      const updatedCampaigns = await Promise.all(savedCampaigns.map(async (campaign) => {
        let campaignUpdated = false;
        const updatedPosts = await Promise.all(campaign.posts.map(async (post) => {
          let postUpdated = false;
          let newPost = { ...post };

          // Check main post imageUrl
          if (newPost.imageUrl && newPost.imageUrl.startsWith('data:image/')) {
            const imageId = `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const base64Data = newPost.imageUrl;
            
            try {
              // Save to IndexedDB
              await DBService.save({
                id: imageId,
                data: base64Data,
                prompt: newPost.topic || 'Migrated Campaign Visual',
                imagePrompt: newPost.visualPrompt || '',
                timestamp: Date.now(),
                level: 'Default',
                style: newPost.suggestedStyle || 'Default',
                language: 'English',
                resolution: newPost.aspectRatio || '1:1',
                subOptions: { projectId: campaign.projectId || 'proj-1' },
                facts: [],
                searchResults: []
              });
              newPost.imageUrl = `db-img:${imageId}`;
              postUpdated = true;
              campaignUpdated = true;
            } catch (e) {
              console.error("Failed to migrate post image to IDB", e);
            }
          }

          // Check slides
          if (newPost.slides && newPost.slides.length > 0) {
            const updatedSlides = await Promise.all(newPost.slides.map(async (slide) => {
              if (slide.imageUrl && slide.imageUrl.startsWith('data:image/')) {
                const imageId = `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                const base64Data = slide.imageUrl;
                
                try {
                  // Save to IndexedDB
                  await DBService.save({
                    id: imageId,
                    data: base64Data,
                    prompt: `${newPost.topic} - Slide ${slide.slideNumber}: ${slide.title || ''}`,
                    imagePrompt: slide.visualPrompt || '',
                    timestamp: Date.now(),
                    level: 'Default',
                    style: newPost.suggestedStyle || 'Default',
                    language: 'English',
                    resolution: newPost.aspectRatio || '1:1',
                    subOptions: { projectId: campaign.projectId || 'proj-1' },
                    facts: [],
                    searchResults: []
                  });
                  postUpdated = true;
                  campaignUpdated = true;
                  return { ...slide, imageUrl: `db-img:${imageId}` };
                } catch (e) {
                  console.error("Failed to migrate slide image to IDB", e);
                }
              }
              return slide;
            }));

            if (postUpdated) {
              newPost.slides = updatedSlides;
            }
          }

          return newPost;
        }));

        if (campaignUpdated) {
          migratedAny = true;
          return { ...campaign, posts: updatedPosts };
        }
        return campaign;
      }));

      if (migratedAny) {
        console.log("Migrated legacy base64 images from localStorage to IndexedDB");
        setSavedCampaigns(updatedCampaigns);
      }
    };

    if (savedCampaigns && savedCampaigns.length > 0) {
      migrateCampaigns();
    }
  }, []);

  // Handle active campaign selection & form population
  const handleSelectCampaign = (id: string | null) => {
    setActiveCampaignId(id);
    if (id) {
      const camp = savedCampaigns.find(c => c.id === id);
      if (camp) {
        setCampaignPosts(camp.posts);
      } else {
        setCampaignPosts([]);
      }
    } else {
      setCampaignPosts(null);
    }
  };

  // Restore active campaign upon tab switch or component mount
  useEffect(() => {
    if (activeCampaignId) {
      const camp = savedCampaigns.find(c => c.id === activeCampaignId);
      if (camp) {
        setCampaignPosts(camp.posts);
      }
    }
  }, [activeCampaignId, savedCampaigns]);

  // Create Campaign Project
  const handleCreateCampaignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampWebsite.trim() || !newCampTopic.trim()) {
      setCampaignError("Please provide both the brand website URL and the main topic.");
      return;
    }

    const name = newCampName.trim() || `${newCampPlatform} Campaign: ${newCampTopic.trim().slice(0, 25)}...`;
    
    // Create the basic campaign object
    const campaignId = 'camp-' + Date.now();
    const newCampaign: SavedCampaign = {
      id: campaignId,
      projectId: activeProjectId,
      name: name,
      websiteUrl: newCampWebsite.trim(),
      mainTopic: newCampTopic.trim(),
      platform: newCampPlatform,
      postCount: newCampPostCount,
      customRequirements: newCampStyleGuide.trim() || undefined,
      posts: [],
      createdAt: Date.now()
    };

    if (startMethod === 'empty') {
      // Create empty campaign instantly
      setSavedCampaigns(prev => [newCampaign, ...prev]);
      setActiveCampaignId(campaignId);
      setCampaignPosts([]);
      
      // Reset creation form
      setNewCampName('');
      setNewCampWebsite('');
      setNewCampTopic('');
      setNewCampPlatform('Instagram');
      setNewCampPostCount(5);
      setNewCampStyleGuide('');
      return;
    }

    // Otherwise, generate starting posts first
    setIsGeneratingCampaign(true);
    setCampaignError(null);
    setCampaignStatus("Scanning brand website, analyzing visual styling, and building campaign wireframes...");

    try {
      const statuses = [
        "Analyzing company core competencies...",
        "Scraping brand aesthetic anchors...",
        "Generating high-converting captions and viral hashtags...",
        "Formulating structured visual generator prompt ideas...",
        "Polishing campaign sequence layout..."
      ];
      
      let statusIdx = 0;
      const statusInterval = setInterval(() => {
        if (statusIdx < statuses.length) {
          setCampaignStatus(statuses[statusIdx]);
          statusIdx++;
        }
      }, 3000);

      const posts = await generateSocialCampaign(
        newCampWebsite.trim(),
        newCampTopic.trim(),
        newCampPlatform,
        newCampPostCount,
        newCampStyleGuide.trim() || undefined,
        newCampTemplate || undefined
      );

      clearInterval(statusInterval);

      // Apply chosen preferred aspect ratio & visual style if specified
      const formattedPosts = posts.map(p => ({
        ...p,
        aspectRatio: (newCampAspect || p.aspectRatio || '9:16') as AspectRatio,
        suggestedStyle: newCampStyle !== 'Default' ? newCampStyle : (p.suggestedStyle || 'Default'),
      }));

      const completedCampaign: SavedCampaign = {
        ...newCampaign,
        posts: formattedPosts
      };

      setSavedCampaigns(prev => [completedCampaign, ...prev]);
      setActiveCampaignId(campaignId);
      setCampaignPosts(formattedPosts);

      // Reset creation form
      setNewCampName('');
      setNewCampWebsite('');
      setNewCampTopic('');
      setNewCampPlatform('Instagram');
      setNewCampPostCount(5);
      setNewCampStyleGuide('');
      setNewCampTemplate('');
      setNewCampAspect('9:16');
      setNewCampStyle('Default');
    } catch (err: any) {
      console.error(err);
      setCampaignError(err.message || "Failed to draft initial posts. The campaign has been created with empty posts, you can add or retry later.");
      // Still save it so we don't lose the project settings!
      setSavedCampaigns(prev => [newCampaign, ...prev]);
      setActiveCampaignId(campaignId);
      setCampaignPosts([]);
    } finally {
      setIsGeneratingCampaign(false);
      setCampaignStatus("");
    }
  };

  // Add custom manual post to current campaign
  const handleAddPostManualSubmit = (e: React.FormEvent, callback?: () => void) => {
    e.preventDefault();
    if (!manualPostTitle.trim() || !manualPostPrompt.trim()) return;
    if (!activeCampaignId || !campaignPosts) return;

    const newPost: SocialPostCampaignItem = {
      day: `Post #${campaignPosts.length + 1}: ${manualPostTitle.trim()}`,
      topic: manualPostTitle.trim(),
      visualPrompt: manualPostPrompt.trim(),
      caption: manualPostCaption.trim(),
      hashtags: manualPostHashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(h => h.length > 0),
      suggestedStyle: manualPostStyle,
      aspectRatio: manualPostAspect
    };

    const updatedPosts = [...campaignPosts, newPost];
    setCampaignPosts(updatedPosts);

    // Sync to saved list
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updatedPosts } : c));

    // Reset manual form
    setManualPostTitle('');
    setManualPostPrompt('');
    setManualPostCaption('');
    setManualPostHashtags('');
    setManualPostStyle('Default');
    setManualPostAspect('1:1');
    if (callback) callback();
  };

  // Generate a single custom post with AI
  const handleGenerateSinglePostAI = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCamp = savedCampaigns.find(c => c.id === activeCampaignId);
    if (!activeCamp || !singlePostInstruction.trim()) return;

    setIsGeneratingSinglePost(true);
    setCampaignError(null);

    try {
      const newPost = await generateSingleSocialPost(
        activeCamp.websiteUrl,
        activeCamp.mainTopic,
        activeCamp.platform,
        singlePostInstruction.trim(),
        activeCamp.posts.length
      );

      const updatedPosts = [...activeCamp.posts, newPost];
      setCampaignPosts(updatedPosts);
      setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updatedPosts } : c));
      
      setSinglePostInstruction('');
      setShowSingleAIPostForm(false);
    } catch (err: any) {
      console.error(err);
      setCampaignError(err.message || "Failed to generate new campaign post. Please try again.");
    } finally {
      setIsGeneratingSinglePost(false);
    }
  };

  // Auto-generate or re-generate full campaign posts for active campaign
  const handleAutoGenerateCampaignPosts = async () => {
    const activeCamp = savedCampaigns.find(c => c.id === activeCampaignId);
    if (!activeCamp) return;

    setIsGeneratingCampaign(true);
    setCampaignError(null);
    setCampaignStatus("Scanning brand website, running AI market research, and drafting full campaign sequence...");

    try {
      const posts = await generateSocialCampaign(
        activeCamp.websiteUrl,
        activeCamp.mainTopic,
        activeCamp.platform,
        activeCamp.postCount || 5,
        activeCamp.customRequirements
      );

      const formattedPosts = posts.map(p => ({
        ...p,
        aspectRatio: (p.aspectRatio || '9:16') as AspectRatio,
        suggestedStyle: p.suggestedStyle || 'Default'
      }));

      setCampaignPosts(formattedPosts);
      setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: formattedPosts } : c));
    } catch (err: any) {
      console.error(err);
      let errText = err?.message || "Failed to generate campaign posts. Please check your API key and try again.";
      if (errText.includes('RESOURCE_EXHAUSTED') || errText.includes('429')) {
        errText = "Gemini API project spend cap reached. Please check your quota at Google AI Studio.";
      }
      setCampaignError(errText);
    } finally {
      setIsGeneratingCampaign(false);
      setCampaignStatus("");
    }
  };

  // Refine a specific single post by index
  const handleRefineSinglePostAI = async (postIndex: number, instructionText: string) => {
    if (!campaignPosts || !activeCampaignId || postIndex < 0 || postIndex >= campaignPosts.length) return;
    const activeCamp = savedCampaigns.find(c => c.id === activeCampaignId);
    if (!activeCamp || !instructionText.trim()) return;

    setIsRefining(true);
    setCampaignError(null);

    try {
      const targetPost = campaignPosts[postIndex];
      const updatedPost = await refineSingleSocialPost(
        targetPost,
        instructionText.trim(),
        activeCamp.platform
      );

      const updatedPosts = [...campaignPosts];
      updatedPosts[postIndex] = updatedPost;

      setCampaignPosts(updatedPosts);
      setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updatedPosts } : c));
    } catch (err: any) {
      console.error("Failed to refine single post:", err);
      setCampaignError(err.message || "Failed to refine post with AI.");
    } finally {
      setIsRefining(false);
    }
  };

  // Delete a specific post inside a campaign
  const handleDeletePost = (indexToDelete: number) => {
    if (!activeCampaignId || !campaignPosts) return;
    
    const updated = campaignPosts.filter((_, idx) => idx !== indexToDelete);
    setCampaignPosts(updated);
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updated } : c));
  };

  // Refine existing campaign posts
  const handleRefineCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementText.trim() || !campaignPosts || !activeCampaignId) return;

    const activeCamp = savedCampaigns.find(c => c.id === activeCampaignId);
    if (!activeCamp) return;

    setIsRefining(true);
    setCampaignError(null);
    setCampaignStatus(`Refining all campaign draft copies...`);

    try {
      const refinedPosts = await generateSocialCampaign(
        activeCamp.websiteUrl,
        activeCamp.mainTopic,
        activeCamp.platform,
        campaignPosts.length,
        `Refinement Instructions: ${refinementText.trim()}. Current drafts to optimize: ${JSON.stringify(campaignPosts)}`
      );
      
      setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: refinedPosts } : c));
      setCampaignPosts(refinedPosts);
      setRefinementText('');
    } catch (err: any) {
      console.error(err);
      setCampaignError("Refinement failed. Please try again.");
    } finally {
      setIsRefining(false);
      setCampaignStatus("");
    }
  };

  // Launch a suggested post directly to the main generative canvas
  const handleLaunchPost = (post: SocialPostCampaignItem, slide?: CarouselSlide | null) => {
    const activePrompt = slide ? slide.visualPrompt : post.visualPrompt;
    const activeTopic = slide ? `${post.topic} (Slide ${slide.slideNumber}: ${slide.title})` : post.topic;
    
    const tempDraft: DraftPrompt = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic: activePrompt || activeTopic,
      complexityLevel: 'Default',
      visualStyle: post.suggestedStyle || 'Default',
      language: 'English',
      resolution: post.aspectRatio || '1:1',
      subOptions: {},
      createdAt: Date.now(),
      sourceType: 'campaign',
      visualPrompt: activePrompt
    };
    onLaunchDraft(tempDraft);
  };

  // Save suggested post as a blueprint draft with campaign metadata
  const handleSavePostAsDraft = (
    post: SocialPostCampaignItem, 
    slide?: CarouselSlide | null, 
    campaignName?: string, 
    campaignId?: string
  ) => {
    const promptText = slide ? slide.visualPrompt : post.visualPrompt;
    const topicTitle = slide 
      ? `${post.topic} — Slide ${slide.slideNumber}: ${slide.title}`
      : post.topic;

    onCreateDraft({
      topic: topicTitle,
      complexityLevel: 'Default',
      visualStyle: post.suggestedStyle || 'Default',
      language: 'English',
      resolution: post.aspectRatio || '1:1',
      subOptions: {},
      sourceType: 'campaign',
      sourceCampaignName: campaignName || (activeCampaignId ? savedCampaigns.find(c => c.id === activeCampaignId)?.name : undefined),
      sourceCampaignId: campaignId || activeCampaignId || undefined,
      slideNumber: slide ? slide.slideNumber : undefined,
      slideTitle: slide ? slide.title : undefined,
      visualPrompt: promptText,
    });
  };

  // Save all slides of a carousel post as separate drafts
  const handleSaveAllSlidesAsDrafts = (
    post: SocialPostCampaignItem,
    campaignName?: string,
    campaignId?: string
  ) => {
    const campName = campaignName || (activeCampaignId ? savedCampaigns.find(c => c.id === activeCampaignId)?.name : undefined);
    const campId = campaignId || activeCampaignId || undefined;

    if (post.slides && post.slides.length > 0) {
      post.slides.forEach((slide) => {
        onCreateDraft({
          topic: `${post.topic} — Slide ${slide.slideNumber}: ${slide.title}`,
          complexityLevel: 'Default',
          visualStyle: post.suggestedStyle || 'Default',
          language: 'English',
          resolution: post.aspectRatio || '1:1',
          subOptions: {},
          sourceType: 'campaign',
          sourceCampaignName: campName,
          sourceCampaignId: campId,
          slideNumber: slide.slideNumber,
          slideTitle: slide.title,
          visualPrompt: slide.visualPrompt,
        });
      });
    } else {
      handleSavePostAsDraft(post, null, campName, campId);
    }
  };

  // Edit inline campaign post values
  const startEditingPost = (idx: number, post: SocialPostCampaignItem) => {
    setEditingPostIndex(idx);
    setEditTopic(post.topic);
    setEditVisualPrompt(post.visualPrompt);
    setEditCaption(post.caption);
    setEditHashtags(post.hashtags.join(', '));
    setEditStyle(post.suggestedStyle || 'Default');
    setEditAspect(post.aspectRatio || '1:1');
  };

  const saveEditedPost = (idx: number) => {
    if (!campaignPosts || !activeCampaignId) return;
    const updated = [...campaignPosts];
    updated[idx] = {
      ...updated[idx],
      topic: editTopic,
      visualPrompt: editVisualPrompt,
      caption: editCaption,
      hashtags: editHashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(h => h.length > 0),
      suggestedStyle: editStyle,
      aspectRatio: editAspect,
    };

    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updated } : c));
    setCampaignPosts(updated);
    setEditingPostIndex(null);
  };

  const handleUpdatePostAspect = (idx: number, newAspect: AspectRatio) => {
    if (!campaignPosts || !activeCampaignId) return;
    const updated = [...campaignPosts];
    updated[idx] = { ...updated[idx], aspectRatio: newAspect };
    setCampaignPosts(updated);
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updated } : c));
  };

  const handleUpdatePostStyle = (idx: number, newStyle: VisualStyle) => {
    if (!campaignPosts || !activeCampaignId) return;
    const updated = [...campaignPosts];
    updated[idx] = { ...updated[idx], suggestedStyle: newStyle };
    setCampaignPosts(updated);
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updated } : c));
  };

  const handleUpdateCampaignPosts = (updatedPosts: SocialPostCampaignItem[]) => {
    if (!activeCampaignId) return;
    setCampaignPosts(updatedPosts);
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, posts: updatedPosts } : c));
  };

  // Save renamed campaign name
  const handleRenameSave = () => {
    if (!tempName.trim() || !activeCampaignId) {
      setIsRenaming(false);
      return;
    }
    setSavedCampaigns(prev => prev.map(c => c.id === activeCampaignId ? { ...c, name: tempName.trim() } : c));
    setIsRenaming(false);
  };

  // Copy helper
  const handleCopyToClipboard = (text: string, index: number, type: 'prompt' | 'caption') => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedIndex(null);
      setCopiedType(null);
    }, 2000);
  };

  // Filter campaigns by active project (Phase 2 sandbox isolation)
  const activeProjectCampaigns = savedCampaigns.filter(c => (c.projectId || 'proj-1') === activeProjectId);

  return {
    newCampName, setNewCampName,
    newCampWebsite, setNewCampWebsite,
    newCampTopic, setNewCampTopic,
    newCampPlatform, setNewCampPlatform,
    newCampPostCount, setNewCampPostCount,
    newCampStyleGuide, setNewCampStyleGuide,
    newCampAspect, setNewCampAspect,
    newCampStyle, setNewCampStyle,
    startMethod, setStartMethod,
    newCampTemplate, setNewCampTemplate,
    campaignPosts, setCampaignPosts,
    isGeneratingCampaign, setIsGeneratingCampaign,
    campaignError, setCampaignError,
    campaignStatus, setCampaignStatus,
    savedCampaigns: activeProjectCampaigns, setSavedCampaigns,
    activeCampaignId, setActiveCampaignId,
    isRenaming, setIsRenaming,
    tempName, setTempName,
    editingPostIndex, setEditingPostIndex,
    editTopic, setEditTopic,
    editVisualPrompt, setEditVisualPrompt,
    editCaption, setEditCaption,
    editHashtags, setEditHashtags,
    editStyle, setEditStyle,
    editAspect, setEditAspect,
    manualPostTitle, setManualPostTitle,
    manualPostPrompt, setManualPostPrompt,
    manualPostCaption, setManualPostCaption,
    manualPostHashtags, setManualPostHashtags,
    manualPostStyle, setManualPostStyle,
    manualPostAspect, setManualPostAspect,
    showSingleAIPostForm, setShowSingleAIPostForm,
    singlePostInstruction, setSinglePostInstruction,
    isGeneratingSinglePost, setIsGeneratingSinglePost,
    refinementText, setRefinementText,
    isRefining, setIsRefining,
    copiedIndex, setCopiedIndex,
    copiedType, setCopiedType,
    handleSelectCampaign,
    handleCreateCampaignProject,
    handleAutoGenerateCampaignPosts,
    handleRefineSinglePostAI,
    handleAddPostManualSubmit,
    handleGenerateSinglePostAI,
    handleDeletePost,
    handleRefineCampaign,
    handleLaunchPost,
    handleSavePostAsDraft,
    handleSaveAllSlidesAsDrafts,
    startEditingPost,
    saveEditedPost,
    handleUpdatePostAspect,
    handleUpdatePostStyle,
    handleRenameSave,
    handleCopyToClipboard,
    handleUpdateCampaignPosts,
  };
};
