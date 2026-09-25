/**
 * KalaSetu - Cross-Platform Mobile Application
 * Smart India Hackathon 2026 - Problem Statement SIH26090
 * Ministry of Social Justice and Empowerment (MoSJE)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Switch,
  ImageStyle,
  Animated,
  Easing,
  Dimensions,
  RefreshControl,
  Share
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from './constants/Colors';
import { i18n, additionalTranslations, getAppText, Language } from './constants/i18n';

import {
  CraftProduct,
  AiAnalysisResult,
  fetchMarketplaceProducts,
  analyzeProductPhoto,
  NetworkError,
  publishProductToApi,
  SEED_PRODUCTS,
  AppUser,
  UserRole,
  OrderRecord,
  loginUser,
  loginWithPhone,
  registerWithPhone,
  registerUser,
  sendOtpApi,
  verifyOtpApi,
  SendOtpResponse,
  createOrder,
  fetchOrdersForUser,
  cancelOrderApi,
  addProductReview,
  deleteProduct,
  deleteOrderApi,
  fetchPublishedProducts,
  fetchIncomingOrders,
  updateOrderStatusApi,
  loginAdmin,
  fetchAdminRequests,
  updateAdminRequest,
  AdminRequest,
  generateInstitutionalRfqApi,
  getBackendUrl,
  setBackendUrl,
  getDevBackendUrl,
  CLOUD_BACKEND_URL
} from './services/api';

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: { resultIndex?: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (event: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface InteractivePopupConfig {
  visible: boolean;
  type?: 'network' | 'welcome' | 'success' | 'alert' | 'error';
  title: string;
  subtitle?: string;
  message: string;
  primaryText?: string;
  primaryAction?: () => void;
  secondaryText?: string;
  secondaryAction?: () => void;
}

function SplashScreenView({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleLogo = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clean, high-end reveal of the Kalasetu brand logo icon followed by typography
    Animated.sequence([
      // 1. Icon Pop & Spring In
      Animated.parallel([
        Animated.spring(scaleLogo, {
          toValue: 1,
          friction: 5.5,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // 2. Brand Title reveal: "Kalasetu"
      Animated.timing(brandAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      // 3. Subtitle reveal: "Ai studio and market linkage"
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // 4. Pause so user comfortably sees the logo and branding
      Animated.delay(1000),
      // 5. Smooth fade transition into main home interface
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Quick Skip button */}
      <TouchableOpacity style={splashStyles.skipButton} onPress={onFinish} activeOpacity={0.7}>
        <Text style={splashStyles.skipText}>Skip ›</Text>
      </TouchableOpacity>

      <View style={splashStyles.centerContent}>
        {/* Styled Kalasetu Brand Logo Icon (No stroke drawing) */}
        <Animated.View
          style={[
            splashStyles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: scaleLogo }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FB923C', '#EA580C', '#C2410C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={splashStyles.iconBadge}
          >
            <Text style={splashStyles.iconGlyph}>क</Text>
          </LinearGradient>
        </Animated.View>

        {/* Brand App Name: Kalasetu */}
        <Animated.View
          style={{
            opacity: brandAnim,
            transform: [
              {
                translateY: brandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
            alignItems: 'center',
            marginTop: 22,
          }}
        >
          <Text style={splashStyles.brandTitle}>Kalasetu</Text>
        </Animated.View>

        {/* Subtitle: Ai studio and market linkage */}
        <Animated.View
          style={{
            opacity: subtitleAnim,
            transform: [
              {
                translateY: subtitleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Text style={splashStyles.brandSubtitle}>Ai studio and market linkage</Text>
        </Animated.View>
      </View>

      {/* Bottom Attribution */}
      <View style={splashStyles.bottomStrip}>
        <Text style={splashStyles.bottomText}>SIH 2026 • Ministry of Social Justice & Empowerment</Text>
      </View>
    </Animated.View>
  );
}

function InteractiveModal({
  config,
  onClose,
}: {
  config: InteractivePopupConfig;
  onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config.visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [config.visible]);

  if (!config.visible) return null;

  const iconByType: Record<string, string> = {
    network: '📡',
    welcome: '🎉',
    success: '✅',
    alert: '⚠️',
    error: '❌',
  };

  const badgeBgByType: Record<string, string> = {
    network: '#FEF3C7',
    welcome: '#FFEDD5',
    success: '#DCFCE7',
    alert: '#FEF3C7',
    error: '#FEE2E2',
  };

  const badgeBorderByType: Record<string, string> = {
    network: '#F59E0B',
    welcome: '#EA580C',
    success: '#16A34A',
    alert: '#F59E0B',
    error: '#EF4444',
  };

  const modalType = config.type || 'alert';

  return (
    <Modal visible={config.visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <Animated.View
          style={[
            modalStyles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Decorative Icon Badge */}
          <View
            style={[
              modalStyles.iconBadge,
              {
                backgroundColor: badgeBgByType[modalType] || '#FFF7ED',
                borderColor: badgeBorderByType[modalType] || '#EA580C',
              },
            ]}
          >
            <Text style={modalStyles.iconText}>{iconByType[modalType] || '💡'}</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={modalStyles.title}>{config.title}</Text>
          {config.subtitle ? <Text style={modalStyles.subtitle}>{config.subtitle}</Text> : null}

          {/* Message Body */}
          <Text style={modalStyles.message}>{config.message}</Text>

          {/* Action Buttons */}
          <View style={modalStyles.buttonRow}>
            {config.secondaryText ? (
              <TouchableOpacity
                style={modalStyles.secondaryBtn}
                onPress={config.secondaryAction || onClose}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.secondaryBtnText}>{config.secondaryText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                modalStyles.primaryBtn,
                config.type === 'network' && { backgroundColor: '#EA580C' },
                !config.secondaryText && { flex: 1 },
              ]}
              onPress={config.primaryAction || onClose}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.primaryBtnText}>{config.primaryText || 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function App() {
  const catalogDraftKey = 'kalasetu_catalog_drafts';
  const bulkDraftKey = 'kalasetu_bulk_drafts';

  // Launch Fullscreen Splash Animation State
  const [showSplash, setShowSplash] = useState(true);

  // Interactive Popup Modal State
  const [popupConfig, setPopupConfig] = useState<InteractivePopupConfig>({
    visible: false,
    type: 'network',
    title: '',
    message: '',
  });

  const showCustomPopup = (config: Omit<InteractivePopupConfig, 'visible'>) => {
    setPopupConfig({ ...config, visible: true });
  };

  const hideCustomPopup = () => {
    setPopupConfig(prev => ({ ...prev, visible: false }));
  };

  // Navigation & Language State
  const [activeTab, setActiveTab] = useState<'home' | 'studio' | 'market' | 'institutional' | 'account' | 'wishlist' | 'orders' | 'profile'>('home');
  const [accountView, setAccountView] = useState<'profile' | 'history' | 'orders' | 'requests' | 'wishlist' | 'notifications' | 'admin'>('profile');
  const [lang, setLang] = useState<Language>('en');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  // Unified user account state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authPassword, setAuthPassword] = useState('artisan123');
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'email' | 'phone'>('password');
  const [authPhone, setAuthPhone] = useState('+919876543210');
  const [authEmail, setAuthEmail] = useState('artisan@kalakriti.in');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('artisan');
  const [authCity, setAuthCity] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authOtp, setAuthOtp] = useState('');
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [authErrorNotice, setAuthErrorNotice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bulkProductName, setBulkProductName] = useState('Pure Brass Dokra Lamp & Desk Stand');
  const [bulkNeed, setBulkNeed] = useState('');
  const [bulkBuyerType, setBulkBuyerType] = useState('Retail / Institutional Buyer');
  const [bulkCategory, setBulkCategory] = useState('Brass & Metalcraft');
  const [bulkHsnCode, setBulkHsnCode] = useState('7419');
  const [bulkGstRate, setBulkGstRate] = useState('12%');
  const [bulkQuantity, setBulkQuantity] = useState('100');
  const [bulkUnitPrice, setBulkUnitPrice] = useState('450');
  const [bulkLeadTime, setBulkLeadTime] = useState('12-15 working days');
  const [isGeneratingBulkAi, setIsGeneratingBulkAi] = useState(false);
  const [craftPickerModalVisible, setCraftPickerModalVisible] = useState(false);

  // Compliance & Multi-Channel Syndication Preview State
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);
  const [complianceTab, setComplianceTab] = useState<'gem' | 'ondc'>('gem');
  const [complianceCsvData, setComplianceCsvData] = useState<string>('');
  const [complianceJsonData, setComplianceJsonData] = useState<any>(null);
  const [isComplianceLoading, setIsComplianceLoading] = useState(false);

  // Artisan Studio State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [artisanName, setArtisanName] = useState('Ramvati Devi');
  const [artisanLocation, setArtisanLocation] = useState('Madhubani, Bihar');
  const [artisanPhone, setArtisanPhone] = useState('+919876543210');
  const [artisanNotes, setArtisanNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [voiceLanguage, setVoiceLanguage] = useState<'en-IN' | 'kn-IN' | 'hi-IN'>('kn-IN');
  const browserRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const browserListeningRef = useRef(false);
  const browserTranscriptRef = useRef('');
  const nativeListeningRef = useRef(false);
  const [priceIdea, setPriceIdea] = useState('');
  const [isEnhanced, setIsEnhanced] = useState(false);

  // AI & Review State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Pottery & Terracotta');
  const [editPrice, setEditPrice] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescHi, setEditDescHi] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [listingQuantity, setListingQuantity] = useState('1');

  // Marketplace State
  const [products, setProducts] = useState<CraftProduct[]>(SEED_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<OrderRecord[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderSubTab, setOrderSubTab] = useState<'incoming' | 'mine' | 'published'>('incoming');
  const [publishedProducts, setPublishedProducts] = useState<CraftProduct[]>([]);
  const [cancelReason, setCancelReason] = useState('Changed requirement / buyer changed decision');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [orderActionMessage, setOrderActionMessage] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState({
    recipientName: '', recipientPhone: '', addressLine: '', city: '', state: '', pincode: ''
  });
  const [catalogDrafts, setCatalogDrafts] = useState<Array<{ id: string; title: string; savedAt: string; data: Record<string, unknown> }>>([]);
  const [bulkDrafts, setBulkDrafts] = useState<Array<{ id: string; savedAt: string; data: Record<string, string> }>>([]);
  const [adminToken, setAdminToken] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [adminStatus, setAdminStatus] = useState('');

  const t = { ...i18n, ...additionalTranslations }[lang];
  const tx = (key: Parameters<typeof getAppText>[1]) => getAppText(lang, key);
  const speechLocale = ({ en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', te: 'te-IN', ml: 'ml-IN', mr: 'mr-IN', bh: 'hi-IN', bho: 'hi-IN' } as const)[lang];
  const statusBarInset = Platform.OS === 'android' ? 24 : 0;
  const topSafeInset = statusBarInset;
  const roleLabel = currentUser?.role === 'buyer'
    ? (lang === 'hi' ? 'खरीदार' : lang === 'ta' ? 'வாங்குபவர்' : lang === 'kn' ? 'ಖರೀದಿದಾರ' : lang === 'te' ? 'కొనుగోలుదారు' : lang === 'ml' ? 'വാങ്ങുന്നയാൾ' : lang === 'mr' ? 'खरेदीदार' : 'Buyer')
    : currentUser?.role === 'artisan'
      ? (lang === 'hi' ? 'कारीगर' : lang === 'ta' ? 'கைவினைஞர்' : lang === 'kn' ? 'ಕಲಾವಿದ' : lang === 'te' ? 'కళాకారుడు' : lang === 'ml' ? 'കലാകാരൻ' : lang === 'mr' ? 'कारागीर' : 'Seller')
      : tx('sellerBuyer');
  const languageOptions: Array<[Language, string]> = [
    ['en', 'English'], ['hi', 'हिंदी'], ['kn', 'ಕನ್ನಡ'], ['te', 'తెలుగు'],
    ['ml', 'മലയാളം'], ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['bh', 'बिहारी'], ['bho', 'भोजपुरी']
  ];
  const bulkQuantityNumber = Math.max(0, Number(bulkQuantity) || 0);
  const bulkUnitPriceNumber = Math.max(0, Number(bulkUnitPrice) || 0);
  const bulkPricingTiers = [
    { volume: '1-10 units', price: bulkUnitPriceNumber, minimum: 1, margin: 'Retail' },
    { volume: '11-50 units', price: bulkUnitPriceNumber * 0.87, minimum: 11, margin: '13% savings' },
    { volume: '50+ units', price: bulkUnitPriceNumber * 0.74, minimum: 51, margin: '26% savings' }
  ];

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setSpeechError('');
  });

  useSpeechRecognitionEvent('end', () => {
    if (nativeListeningRef.current) {
      setTimeout(() => {
        if (nativeListeningRef.current) {
          ExpoSpeechRecognitionModule.start({
            lang: voiceLanguage,
            interimResults: true,
            continuous: true,
            maxAlternatives: 1,
          });
        }
      }, 300);
    } else {
      setIsListening(false);
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) {
      setArtisanNotes(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    nativeListeningRef.current = false;
    setIsListening(false);
    setSpeechError(`Speech recognition error: ${event.message || event.error}`);
  });

  // Restore saved session on app launch (persistent login)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('kalasetu_current_user');
        if (savedUser) {
          const user: AppUser = JSON.parse(savedUser);
          setCurrentUser(user);
          if (user.phone) setArtisanPhone(user.phone);
          if (user.name) setArtisanName(user.name);
          if (user.city) setArtisanLocation(user.city);
          setIsLoggedIn(true);
          // Refresh account data in background
          refreshAccountData(user).catch(err => console.warn('Session restore account refresh:', err));
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      }
    };

    loadProducts();
    void loadOfflineDrafts();
    void restoreSession();
    AsyncStorage.getItem('kalasetu_language').then(savedLanguage => {
      if (savedLanguage && ['en', 'hi', 'ta', 'kn', 'te', 'ml', 'mr', 'bh', 'bho'].includes(savedLanguage)) {
        setLang(savedLanguage as Language);
      }
    });
    AsyncStorage.getItem('kalasetu_admin_token').then(token => {
      if (token) {
        setAdminToken(token);
        fetchAdminRequests(token).then(setAdminRequests).catch(() => AsyncStorage.removeItem('kalasetu_admin_token'));
      }
    });
  }, []);

  const handleAdminLogin = async () => {
    try {
      const token = await loginAdmin(adminEmail.trim(), adminPassword);
      await AsyncStorage.setItem('kalasetu_admin_token', token);
      setAdminToken(token);
      setAdminStatus('');
      setAdminRequests(await fetchAdminRequests(token));
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : 'Admin sign-in failed.');
    }
  };

  const handleAdminLogout = async () => {
    await AsyncStorage.removeItem('kalasetu_admin_token');
    setAdminToken('');
    setAdminRequests([]);
  };

  const handleAdminUpdate = async (requestId: number, status: string) => {
    if (!adminToken) return;
    try {
      await updateAdminRequest(adminToken, requestId, status, '');
      setAdminRequests(await fetchAdminRequests(adminToken));
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : 'Review could not be saved.');
    }
  };

  const loadOfflineDrafts = async () => {
    const [catalogValue, bulkValue] = await Promise.all([
      AsyncStorage.getItem(catalogDraftKey),
      AsyncStorage.getItem(bulkDraftKey)
    ]);
    setCatalogDrafts(catalogValue ? JSON.parse(catalogValue) : []);
    setBulkDrafts(bulkValue ? JSON.parse(bulkValue) : []);
  };

  const saveCatalogDraft = async () => {
    const draft = {
      id: String(Date.now()),
      title: editTitle || 'Untitled catalog draft',
      savedAt: new Date().toISOString(),
      data: {
        imageUri, artisanName, artisanLocation, artisanPhone, artisanNotes, priceIdea,
        isEnhanced, editTitle, editCategory, editPrice, editDescEn, editDescHi,
        tags, listingQuantity, newTag
      }
    };
    const nextDrafts = [draft, ...catalogDrafts];
    await AsyncStorage.setItem(catalogDraftKey, JSON.stringify(nextDrafts));
    setCatalogDrafts(nextDrafts);
    Alert.alert('Draft saved offline', 'Your catalog is saved on this device and can be restored without internet.');
  };

  const restoreCatalogDraft = (draft: typeof catalogDrafts[number]) => {
    const data = draft.data;
    setImageUri(typeof data.imageUri === 'string' ? data.imageUri : null);
    setArtisanName(typeof data.artisanName === 'string' ? data.artisanName : '');
    setArtisanLocation(typeof data.artisanLocation === 'string' ? data.artisanLocation : '');
    setArtisanPhone(typeof data.artisanPhone === 'string' ? data.artisanPhone : '');
    setArtisanNotes(typeof data.artisanNotes === 'string' ? data.artisanNotes : '');
    setPriceIdea(typeof data.priceIdea === 'string' ? data.priceIdea : '');
    setIsEnhanced(data.isEnhanced === true);
    setEditTitle(typeof data.editTitle === 'string' ? data.editTitle : '');
    setEditCategory(typeof data.editCategory === 'string' ? data.editCategory : 'Pottery & Terracotta');
    setEditPrice(typeof data.editPrice === 'string' ? data.editPrice : '');
    setEditDescEn(typeof data.editDescEn === 'string' ? data.editDescEn : '');
    setEditDescHi(typeof data.editDescHi === 'string' ? data.editDescHi : '');
    setTags(Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : []);
    setListingQuantity(typeof data.listingQuantity === 'string' ? data.listingQuantity : '1');
    setNewTag(typeof data.newTag === 'string' ? data.newTag : '');
    setActiveTab('studio');
    Alert.alert('Draft restored', 'Continue editing your saved catalog.');
  };

  const removeCatalogDraft = async (draftId: string) => {
    const nextDrafts = catalogDrafts.filter(draft => draft.id !== draftId);
    await AsyncStorage.setItem(catalogDraftKey, JSON.stringify(nextDrafts));
    setCatalogDrafts(nextDrafts);
  };

  const saveBulkDraft = async () => {
    const draft = {
      id: String(Date.now()),
      savedAt: new Date().toISOString(),
      data: { bulkNeed, bulkBuyerType, bulkCategory, bulkQuantity, bulkUnitPrice, bulkLeadTime }
    };
    const nextDrafts = [draft, ...bulkDrafts];
    await AsyncStorage.setItem(bulkDraftKey, JSON.stringify(nextDrafts));
    setBulkDrafts(nextDrafts);
    Alert.alert('Bulk draft saved offline', 'Your institutional request is saved on this device.');
  };

  const restoreBulkDraft = (draft: typeof bulkDrafts[number]) => {
    setBulkNeed(draft.data.bulkNeed || '');
    setBulkBuyerType(draft.data.bulkBuyerType || 'Retail / Institutional Buyer');
    setBulkCategory(draft.data.bulkCategory || 'Handloom & Textiles');
    setBulkQuantity(draft.data.bulkQuantity || '100');
    setBulkUnitPrice(draft.data.bulkUnitPrice || '250');
    setBulkLeadTime(draft.data.bulkLeadTime || '7-15 working days');
    Alert.alert('Bulk draft restored', 'Continue editing your saved RFQ.');
  };

  const loadProducts = async () => {
    const data = await fetchMarketplaceProducts();
    setProducts(data);
  };

  const onRefreshMarketplace = async () => {
    setIsRefreshing(true);
    try {
      await loadProducts();
      // Also refresh incoming orders if logged in
      if (currentUser) {
        await refreshAccountData(currentUser);
      }
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshAccountData = async (user: AppUser) => {
    try {
      const [userOrders, userListings, incoming] = await Promise.all([
        fetchOrdersForUser(user.id).catch(() => []),
        fetchPublishedProducts(user.id, user.name, user.phone).catch(() => []),
        fetchIncomingOrders(user.id).catch(() => [])
      ]);
      setOrders(userOrders);
      if (userListings && userListings.length > 0) {
        setPublishedProducts(userListings);
      }
      setIncomingOrders(incoming);
    } catch (err) {
      console.warn("refreshAccountData error:", err);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: 'Accepted' | 'Rejected' | 'Dispatched' | 'Delivered',
    note: string = ''
  ) => {
    if (!currentUser) return;
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusApi(orderId, currentUser.id, newStatus, note);
      Alert.alert(
        newStatus === 'Accepted' ? '✅ Order Accepted!' : newStatus === 'Rejected' ? '❌ Order Rejected' : 'Status Updated',
        newStatus === 'Accepted'
          ? 'You accepted this order request. Please prepare the craft for packaging and dispatch.'
          : newStatus === 'Rejected'
          ? 'Order was rejected. The reserved quantity has been restored back to your product listing.'
          : `Order marked as ${newStatus}.`
      );
      await Promise.all([
        refreshAccountData(currentUser),
        loadProducts()
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAuthSubmit = async () => {
    if (authLoading) return;
    setAuthLoading(true);
    setAuthErrorNotice('');

    try {
      let user: AppUser | null = null;

      if (authMethod === 'phone') {
        if (!authPhone.trim()) {
          throw new Error(lang === 'hi' ? 'कृपया अपना मोबाइल नंबर दर्ज करें।' : 'Please enter your mobile number.');
        }
        user = await loginWithPhone(authPhone.trim(), authPassword.trim());
      } else {
        if (!authEmail.trim()) {
          throw new Error(lang === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
        }
        user = await loginUser(authEmail.trim(), authPassword.trim(), authRole);
      }

      if (!user) {
        throw new Error(lang === 'hi' ? 'अमान्य क्रेडेंशियल्स।' : 'Invalid credentials. Please check your details.');
      }

      setCurrentUser(user);
      if (user.phone) setArtisanPhone(user.phone);
      if (user.name) setArtisanName(user.name);
      if (user.city) setArtisanLocation(user.city);
      setIsLoggedIn(true);
      setActiveTab('home');
      // Persist session for auto-login on next app open
      await AsyncStorage.setItem('kalasetu_current_user', JSON.stringify(user));

      showCustomPopup({
        type: 'welcome',
        title: lang === 'hi' ? `नमस्ते, ${user.name || 'कारीगर'}!` : `Welcome back, ${user.name || 'Artisan'}! 🎉`,
        subtitle: lang === 'hi' ? 'कलासेतु में आपका स्वागत है' : 'KalaSetu AI Studio',
        message: lang === 'hi'
          ? `आपका खाता (${user.phone || user.email}) सफलतापूर्वक सक्रिय हो गया है।`
          : `Logged in as ${user.phone || user.email}.`,
        primaryText: user.role === 'buyer' ? (lang === 'hi' ? '🛍️ बाज़ार देखें' : '🛍️ Explore Market') : (lang === 'hi' ? '🎨 शिल्प स्टूडियो' : '🎨 Open AI Studio'),
        primaryAction: () => {
          hideCustomPopup();
          setActiveTab(user.role === 'buyer' ? 'market' : 'studio');
        },
        secondaryText: 'OK',
        secondaryAction: hideCustomPopup
      });

      try {
        await refreshAccountData(user);
      } catch (error) {
        console.warn('Account activity unavailable:', error);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Authentication error';
      setAuthErrorNotice(errMsg);
      showCustomPopup({
        type: 'error',
        title: lang === 'hi' ? 'साइन-इन विफल' : 'Sign-In Failed',
        subtitle: 'Invalid Credentials',
        message: errMsg,
        primaryText: 'OK',
        primaryAction: hideCustomPopup
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const target = authMethod === 'phone' ? authPhone.trim() : authEmail.trim();
    if (!target) {
      Alert.alert('Required', authMethod === 'phone' ? 'Please enter your mobile number' : 'Please enter your email');
      return;
    }
    if (!authName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name before generating OTP.');
      return;
    }

    setAuthLoading(true);
    setDevOtpNotice('');
    setAuthOtp('');

    try {
      // Generate dummy OTP locally — no backend needed
      const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      setDemoOtpCode(generatedOtp);
      setAuthOtp(generatedOtp);  // Auto-fill
      setShowOtpSection(true);
      setDevOtpNotice(generatedOtp);
      Alert.alert('✅ OTP Ready', `Your OTP is: ${generatedOtp}\n\nIt has been auto-filled. Just tap Verify to continue.`);
    } catch (err: any) {
      Alert.alert('Notice', err?.message || 'Could not generate OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const target = authMethod === 'phone' ? authPhone.trim() : authEmail.trim();
    if (!authOtp.trim()) {
      Alert.alert('Required', 'Please enter the 6-digit OTP shown on this screen');
      return;
    }

    const expectedOtp = demoOtpCode || (devOtpNotice.match(/\d{6}/)?.[0] ?? '');
    if (expectedOtp && authOtp.trim() !== expectedOtp) {
      Alert.alert('Verification Failed', `OTP mismatch. Expected: ${expectedOtp}`);
      return;
    }

    setAuthLoading(true);
    try {
      // verifyOtpApi handles login/register directly without password
      const user = await verifyOtpApi(target, authOtp.trim(), '', authName.trim() || 'KalaSetu User', authRole);
      // Always honour the name the user typed on this device — never let DB override it
      if (authName.trim()) user.name = authName.trim();
      setShowOtpSection(false);
      setCurrentUser(user);
      if (user.phone) setArtisanPhone(user.phone);
      if (user.name) setArtisanName(user.name);
      if (user.city) setArtisanLocation(user.city);
      setIsLoggedIn(true);
      setActiveTab('home');
      // Persist session for auto-login on next app open
      await AsyncStorage.setItem('kalasetu_current_user', JSON.stringify(user));
      showCustomPopup({
        type: 'welcome',
        title: lang === 'hi' ? `नमस्ते, ${user.name}! 🎉` : `Welcome, ${user.name}! 🎉`,
        subtitle: lang === 'hi' ? 'कलासेतु में आपका स्वागत है' : 'KalaSetu AI Studio',
        message: lang === 'hi'
          ? `आपका खाता (${user.phone || user.email}) सफलतापूर्वक सक्रिय हो गया है।`
          : `Logged in as ${user.phone || user.email}.`,
        primaryText: user.role === 'buyer' ? '🛍️ Explore Market' : '🎨 Open AI Studio',
        primaryAction: () => { hideCustomPopup(); setActiveTab(user.role === 'buyer' ? 'market' : 'studio'); },
        secondaryText: 'OK',
        secondaryAction: hideCustomPopup
      });
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.message || 'Could not verify. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('kalasetu_current_user');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setOrders([]);
    setIncomingOrders([]);
    setPublishedProducts([]);
    setActiveTab('home');
  };

  const openHomeMarket = () => {
    setActiveTab('home');
  };

  const toggleWishlist = (productId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to save products to your wishlist.');
      setActiveTab('account');
      return;
    }
    setWishlist(prev => prev.includes(productId)
      ? prev.filter(id => id !== productId)
      : [...prev, productId]);
  };

  const requestOrder = async (product: CraftProduct) => {
    if (!isLoggedIn || !currentUser) {
      setOrderActionMessage('Sign in from Account before placing an order.');
      Alert.alert('Sign in required', 'Please sign in to request an order.');
      setActiveTab('account');
      return;
    }

    const availableQuantity = Math.max(0, Number(product.quantity ?? 10));
    if (availableQuantity <= 0) {
      setOrderActionMessage('This product is sold out.');
      Alert.alert('Sold out', 'This product has no remaining stock.');
      return;
    }

    if (!deliveryDetails.recipientName || !deliveryDetails.recipientPhone || !deliveryDetails.addressLine ||
      !deliveryDetails.city || !deliveryDetails.state || !/^\d{6}$/.test(deliveryDetails.pincode)) {
      setOrderActionMessage('Complete the delivery details above, including a valid 6-digit pincode.');
      Alert.alert('Delivery details required', 'Enter your name, phone, address, city, state, and 6-digit pincode before ordering.');
      return;
    }
    const quantity = Number(buyQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > availableQuantity) {
      setOrderActionMessage(`Choose a quantity from 1 to ${availableQuantity}.`);
      Alert.alert('Invalid quantity', `You can buy between 1 and ${availableQuantity} products for this item.`);
      return;
    }

    setIsPlacingOrder(true);
    setOrderActionMessage('');
    try {
      const order = await createOrder({
        userId: currentUser.id,
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        customerName: currentUser.name,
        ...deliveryDetails
      });

      setOrders(prev => [order, ...prev]);
      // Update local product quantity immediately
      setProducts(prev => prev.map(item => item.id === product.id
        ? { ...item, quantity: Math.max(0, (Number(item.quantity ?? 10)) - quantity) }
        : item
      ));
      setBuyQuantity('1');
      Alert.alert('Order requested', `Your request for ${product.name} has been sent to the artisan.`);
      setActiveTab('account');
      setAccountView('orders');
      // Refresh marketplace products and account data from server
      loadProducts().catch(e => console.warn('Post-order product refresh:', e));
      refreshAccountData(currentUser).catch(e => console.warn('Post-order account refresh:', e));
    } catch (error) {
      setOrderActionMessage(error instanceof Error ? error.message : 'Could not place the order request.');
      Alert.alert('Order request failed', error instanceof Error ? error.message : 'Could not place the order request.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const removeOwnProduct = async (product: CraftProduct) => {
    if (!currentUser) {
      Alert.alert('Sign in required', 'Please sign in to manage marketplace listings.');
      return;
    }
    if (deletingProductId === product.id) return;
    if (Platform.OS === 'web' && !globalThis.confirm('Delete this product listing?')) return;

    if (Platform.OS !== 'web') {
      const shouldDelete = await new Promise<boolean>(resolve => {
        Alert.alert('Delete listing', 'Delete this product listing from marketplace?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ], { cancelable: true, onDismiss: () => resolve(false) });
      });
      if (!shouldDelete) return;
    }

    setDeletingProductId(product.id);
    try {
      await deleteProduct(product.id, currentUser.id);
      setProducts(prev => prev.filter(item => item.id !== product.id));
      setPublishedProducts(prev => prev.filter(item => item.id !== product.id));
      if (currentUser?.id) {
        try {
          const stored = await AsyncStorage.getItem(`@kalasetu_my_published_${currentUser.id}`);
          if (stored) {
            const currentList: CraftProduct[] = JSON.parse(stored);
            const updated = currentList.filter(item => item.id !== product.id);
            await AsyncStorage.setItem(`@kalasetu_my_published_${currentUser.id}`, JSON.stringify(updated));
          }
        } catch {}
      }
      Alert.alert('Deleted', 'Your product listing was deleted.');
    } catch (error) {
      setProducts(prev => prev.filter(item => item.id !== product.id));
      setPublishedProducts(prev => prev.filter(item => item.id !== product.id));
      Alert.alert('Deleted', 'Your product listing was removed.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const submitReview = async (product: CraftProduct) => {
    if (!reviewComment.trim()) {
      Alert.alert('Review required', 'Please write a comment before submitting.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const result = await addProductReview(product.id, currentUser?.name || 'Marketplace visitor', reviewRating, reviewComment.trim());
      setProducts(prev => prev.map(item => item.id === product.id ? { ...item, rating: result.rating, reviews: result.reviews } : item));
      setReviewComment('');
      setReviewProductId(null);
      Alert.alert('Thank you', 'Your rating and review were added.');
    } catch (error) {
      Alert.alert('Review unavailable', error instanceof Error ? error.message : 'Could not submit the review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleBulkSupport = () => {
    const subject = encodeURIComponent(`KalaSetu Bulk RFQ: ${bulkProductName || bulkCategory}`);
    const body = encodeURIComponent(
      `Hello KalaSetu Institutional Desk,\n\nI want to submit an institutional quotation / bulk buyer request for my craft.\n\n` +
      `Product: ${bulkProductName || 'Handmade Craft Batch'}\n` +
      `Category: ${bulkCategory} (HSN: ${bulkHsnCode}, GST: ${bulkGstRate})\n` +
      `Available Batch Units: ${bulkQuantity} units\n` +
      `Wholesale Unit Price: ₹${bulkUnitPrice}\n` +
      `Production & Dispatch Lead Time: ${bulkLeadTime}\n` +
      `Target Buyer: ${bulkBuyerType}\n` +
      `Artisan / Cluster: ${currentUser?.name || authName} (${currentUser?.city || artisanLocation})\n\n` +
      `Procurement Specifications & Packaging:\n${bulkNeed || 'Artisan handmade batch.'}\n\n` +
      `Please connect me with government procurement (GeM) and institutional bulk buyers.`
    );
    Linking.openURL(`mailto:kalasetu24824.9@gmail.com?subject=${subject}&body=${body}`);
  };

  const handleGenerateBulkAi = async () => {
    setIsGeneratingBulkAi(true);
    try {
      const hint = bulkProductName || bulkCategory || 'Handcrafted traditional artisan product';
      const result = await generateInstitutionalRfqApi(hint, bulkCategory, bulkBuyerType);
      if (result) {
        setBulkProductName(result.product_name || bulkProductName);
        if (result.category) setBulkCategory(result.category);
        if (result.hsn_code) setBulkHsnCode(result.hsn_code);
        if (result.gst_rate) setBulkGstRate(result.gst_rate);
        if (result.suggested_unit_price) {
          setBulkUnitPrice(String(result.suggested_unit_price));
        }
        if (result.suggested_lead_time) {
          setBulkLeadTime(result.suggested_lead_time);
        }
        const fullNeed = `Institutional Pitch:\n${result.institutional_description}\n\nMaterial & Quality Assurance:\n${result.quality_assurance}\n\nPackaging & Customization:\n${result.packaging_and_customization}`;
        setBulkNeed(fullNeed);
        Alert.alert(
          '✨ AI Auto-Fill Complete!',
          `Generated procurement listing for "${result.product_name}" (HSN: ${result.hsn_code} · GST: ${result.gst_rate}). You can adjust production units and pricing.`
        );
      }
    } catch (e: any) {
      const fallbackTitle = bulkProductName || `${bulkCategory} Institutional Batch`;
      setBulkProductName(fallbackTitle);
      setBulkNeed(`Institutional Pitch: Handcrafted by certified master artisans under MoSJE linkage. Pre-tested quality.\nPackaging: Individual eco-friendly gift box packaging with custom corporate logo available.`);
      Alert.alert('AI Preset Applied', 'Procurement details and packaging specifications filled.');
    } finally {
      setIsGeneratingBulkAi(false);
    }
  };

  const loadCraftIntoBulk = (item: CraftProduct) => {
    setBulkProductName(`${item.name} (Wholesale Batch)`);
    setBulkCategory(item.category || 'Handicraft');
    setBulkUnitPrice(String(Math.round(item.price * 0.82)));
    setBulkNeed(`Artisan Craft Description:\n${item.description_en || item.name}\n\nCustomization & Packaging:\nIndividual protective gift carton packaging with MoSJE artisan authenticity certificate.`);
    setCraftPickerModalVisible(false);
    Alert.alert('Craft Loaded', `"${item.name}" loaded into your bulk request with wholesale base pricing.`);
  };

  const openBulkChannel = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Link unavailable', 'Please open this channel from a browser.');
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to manage your orders.');
      setActiveTab('account');
      return;
    }

    const reason = cancelReason.trim() || 'Cancelled by buyer';

    try {
      const result = await cancelOrderApi(orderId, reason);
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status: 'Cancelled' } : order));
      Alert.alert(
        'Order cancelled',
        result?.localOnly
          ? 'The order was marked as cancelled.'
          : `The order was cancelled and inventory restored.`
      );
      if (currentUser) {
        refreshAccountData(currentUser);
      }
    } catch (error) {
      Alert.alert('Order cancellation failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!isLoggedIn) {
      Alert.alert('Sign in required', 'Please sign in to manage your orders.');
      return;
    }

    const confirmDelete = await new Promise<boolean>(resolve => {
      Alert.alert(
        'Delete Order',
        'Are you sure you want to remove this order from your list?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });

    if (!confirmDelete) return;

    try {
      await deleteOrderApi(orderId, currentUser?.id);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setIncomingOrders(prev => prev.filter(order => order.id !== orderId));
      Alert.alert('Deleted', 'Order removed from your list.');
    } catch (error) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setIncomingOrders(prev => prev.filter(order => order.id !== orderId));
      Alert.alert('Deleted', 'Order removed from your list.');
    }
  };

  const selectLanguage = async (nextLanguage: Language) => {
    setLang(nextLanguage);
    setIsLanguageMenuOpen(false);
    await AsyncStorage.setItem('kalasetu_language', nextLanguage);
  };

  // Pick Image from Camera
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to photograph crafts.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
      }
    } catch (err: any) {
      console.warn("Camera photo error:", err);
      Alert.alert("Camera Error", err?.message || "Could not open camera.");
    }
  };

  // Pick Image from Gallery
  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Gallery permission is needed to select craft photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
      }
    } catch (err: any) {
      console.warn("Gallery picker error:", err);
      Alert.alert("Gallery Error", err?.message || "Could not open photo gallery.");
    }
  };

  // Load Demo Presets (for instant 1-click jury demonstrations)
  const loadDemoPreset = (presetIndex: number) => {
    setImageBase64(null);
    if (presetIndex === 0) {
      setImageUri("https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Red clay pot made on village wheel with floral engravings");
      setPriceIdea("600");
    } else if (presetIndex === 1) {
      setImageUri("https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Lost wax bell metal craft by Bastar tribal artisans");
      setPriceIdea("1800");
    } else {
      setImageUri("https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=800&q=80");
      setArtisanNotes("Traditional Kutchi mirrorwork embroidered textile");
      setPriceIdea("1400");
    }
  };

  // Run AI Vision Analysis
  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert("Photo Required", "Please take or select a craft photo first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(lang === 'hi' ? "शिल्प की बनावट की जांच..." : "Analyzing craft texture & materials...");

    setTimeout(() => {
      setAnalysisProgress(lang === 'hi' ? "उचित कारीगर मूल्य और टैग तैयार..." : "Calculating fair artisan pricing & SEO tags...");
    }, 1200);

    try {
      const result = await analyzeProductPhoto(imageUri, artisanNotes, priceIdea, imageBase64 || undefined);
      setAiResult(result);
      setEditTitle(result.suggested_title);
      setEditCategory(result.category);
      setEditPrice(String(result.pricing.suggested));
      setEditDescEn(result.description_en);
      setEditDescHi(result.description_hi);
      setTags(result.tags || []);
    } catch (err: any) {
      console.warn("AI Analysis error encountered:", err);
      const isOffline =
        err instanceof NetworkError ||
        err?.isNetworkError ||
        err?.message === 'NO_NETWORK' ||
        err?.message?.includes('Network request failed') ||
        err?.message?.includes('Failed to fetch') ||
        (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine);

      if (isOffline) {
        showCustomPopup({
          type: 'network',
          title: lang === 'hi' ? '📡 नेटवर्क उपलब्ध नहीं है' : '📡 No Network Connection',
          subtitle: lang === 'hi' ? 'इंटरनेट कनेक्शन आवश्यक है' : 'Internet Required for AI Vision',
          message: lang === 'hi'
            ? 'कलासेतु AI विज़न को शिल्प की बनावट का विश्लेषण करने और उचित कारीगर मूल्य तैयार करने के लिए एक सक्रिय इंटरनेट कनेक्शन की आवश्यकता है। कृपया अपना नेटवर्क चेक करें।'
            : 'KalaSetu AI Vision requires an active internet connection to analyze craft textures and calculate fair artisan prices. Please check your Wi-Fi or mobile data and try again.',
          primaryText: lang === 'hi' ? '🔄 पुनः प्रयास करें' : '🔄 Try Again',
          primaryAction: () => {
            hideCustomPopup();
            setTimeout(() => {
              void handleAnalyze();
            }, 300);
          },
          secondaryText: lang === 'hi' ? 'रद्द करें' : 'Dismiss',
          secondaryAction: hideCustomPopup,
        });
      } else {
        showCustomPopup({
          type: 'error',
          title: lang === 'hi' ? 'विश्लेषण त्रुटि' : 'Analysis Error',
          subtitle: lang === 'hi' ? 'सर्वर से संपर्क नहीं हो सका' : 'Could not complete AI analysis',
          message: err?.message || 'Could not complete AI analysis. Please check your backend connection and try again.',
          primaryText: lang === 'hi' ? 'ठीक है' : 'OK',
          primaryAction: hideCustomPopup,
        });
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  // Native Audio Speech
  const toggleSpeech = (text: string, speechLang: string = voiceLanguage) => {
    const languageMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN',
      te: 'te-IN',
      ml: 'ml-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      bh: 'hi-IN',
      bho: 'hi-IN',
    };
    const resolvedLanguage = speechLang.includes('-') ? speechLang : languageMap[speechLang] || voiceLanguage;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: resolvedLanguage,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const toggleVoiceInput = async () => {
    if (isListening) {
      if (Platform.OS === 'web') {
        browserListeningRef.current = false;
        browserRecognitionRef.current?.abort?.();
        browserRecognitionRef.current?.stop();
        browserRecognitionRef.current = null;
        setIsListening(false);
      } else {
        nativeListeningRef.current = false;
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      }
      return;
    }

    setSpeechError('');
    try {
      if (Platform.OS === 'web') {
        const isEmbeddedBrowser = /Electron|Code/.test(navigator.userAgent || '') || !!(globalThis as typeof globalThis & { process?: { versions?: { electron?: unknown } } }).process?.versions?.electron;
        if (isEmbeddedBrowser) {
          setSpeechError('Speech recognition is not available in this embedded browser. Open the app in Chrome or Edge and allow microphone access.');
          return;
        }

        const browserSpeech = globalThis as typeof globalThis & {
          SpeechRecognition?: BrowserSpeechRecognitionConstructor;
          webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
        };
        const Recognition = browserSpeech.SpeechRecognition || browserSpeech.webkitSpeechRecognition;
        if (!Recognition) {
          setSpeechError(tx('voiceError'));
          return;
        }

        const recognition = new Recognition();
        browserRecognitionRef.current = recognition;
        browserTranscriptRef.current = artisanNotes.trim();
        recognition.lang = voiceLanguage;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.onresult = event => {
          let transcript = '';
          const startIndex = event.resultIndex || 0;
          for (let index = startIndex; index < event.results.length; index += 1) {
            transcript += `${event.results[index]?.[0]?.transcript || ''} `;
          }
          const cleanTranscript = transcript.trim();
          if (cleanTranscript) {
            const existing = browserTranscriptRef.current;
            const nextText = existing && !cleanTranscript.startsWith(existing)
              ? `${existing} ${cleanTranscript}`
              : cleanTranscript;
            setArtisanNotes(nextText.trim());
            if (event.results[event.results.length - 1]?.[0]) {
              browserTranscriptRef.current = nextText.trim();
            }
          }
        };
        recognition.onerror = event => {
          browserListeningRef.current = false;
          setIsListening(false);
          setSpeechError(`Speech recognition error: ${event.error || 'unknown error'}`);
        };
        recognition.onend = () => {
          if (browserListeningRef.current) {
            setTimeout(() => {
              if (browserListeningRef.current) {
                try {
                  recognition.start();
                } catch {
                  setTimeout(() => {
                    if (browserListeningRef.current) {
                      try {
                        recognition.start();
                      } catch {
                        // The browser will retry from its next end event.
                      }
                    }
                  }, 1000);
                }
              }
            }, 250);
          } else {
            setIsListening(false);
            browserRecognitionRef.current = null;
          }
        };
        browserListeningRef.current = true;
        try {
          recognition.start();
          setIsListening(true);
        } catch (error) {
          browserListeningRef.current = false;
          browserRecognitionRef.current = null;
          setSpeechError(error instanceof Error ? error.message : tx('voiceError'));
          setIsListening(false);
        }
        return;
      }

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setSpeechError(tx('voicePermissionDenied'));
        return;
      }

      nativeListeningRef.current = true;
      ExpoSpeechRecognitionModule.start({
        lang: voiceLanguage,
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
      });
    } catch (error) {
      setSpeechError(error instanceof Error ? error.message : tx('voiceError'));
    }
  };

  // Add Tag
  const handleAddTag = () => {
    const trimmed = newTag.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag('');
    }
  };

  // Remove Tag
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  // Publish to Marketplace
  const handlePublish = async () => {
    if (!editTitle || !editPrice) {
      Alert.alert("Incomplete Listing", "Please provide a title and price.");
      return;
    }
    const listingQuantityValue = Number(listingQuantity);
    if (!Number.isInteger(listingQuantityValue) || listingQuantityValue < 1 || listingQuantityValue > 10) {
      Alert.alert('Invalid quantity', 'Each listing must contain between 1 and 10 products.');
      return;
    }

    setIsPublishing(true);
    const imageUrl = imageUri || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80";
    const newProduct: Omit<CraftProduct, 'id'> = {
      name: editTitle,
      artisan_name: currentUser?.name || artisanName || "Artisan Beneficiary",
      artisan_location: artisanLocation || "Rural Cluster",
      artisan_phone: currentUser?.phone || artisanPhone || "+919876543210",
      category: editCategory,
      price: Number(editPrice),
      quantity: listingQuantityValue,
      suggested_price_min: aiResult?.pricing.fair_min,
      suggested_price_max: aiResult?.pricing.fair_max,
      price_justification: aiResult?.pricing.justification,
      description_en: editDescEn,
      description_hi: editDescHi,
      tags: tags,
      image_url: imageUrl,
      image_gallery: [imageUrl],
      rating: 4.8,
      reviews: [{ user_name: artisanName || "Verified Buyer", rating: 5, comment: "Fresh artisan listing with marketplace photo." }],
      is_enhanced: isEnhanced,
      mosje_verified: true,
      owner_user_id: currentUser?.id
    };

    try {
      await publishProductToApi(newProduct);
    } catch (error) {
      setIsPublishing(false);
      Alert.alert('Publishing failed', error instanceof Error ? error.message : 'Could not publish this listing.');
      return;
    }
    setIsPublishing(false);

    const createdProduct: CraftProduct = {
      ...newProduct,
      id: Date.now(),
      owner_user_id: currentUser?.id
    };
    // Immediately update local state so "My Listings" has it right away!
    setPublishedProducts(prev => [createdProduct, ...prev.filter(p => p.name !== createdProduct.name)]);
    if (currentUser?.id) {
      try {
        const stored = await AsyncStorage.getItem(`@kalasetu_my_published_${currentUser.id}`);
        const currentList: CraftProduct[] = stored ? JSON.parse(stored) : [];
        const updatedList = [createdProduct, ...currentList.filter(p => p.name !== createdProduct.name)];
        await AsyncStorage.setItem(`@kalasetu_my_published_${currentUser.id}`, JSON.stringify(updatedList));
      } catch {}
    }

    try {
      const [marketplaceProducts] = await Promise.all([
        fetchMarketplaceProducts(),
        currentUser ? refreshAccountData(currentUser) : Promise.resolve()
      ]);
      if (marketplaceProducts && marketplaceProducts.length > 0) {
        setProducts(marketplaceProducts);
      }
    } catch (error) {
      console.warn('Published listing refresh unavailable:', error);
      setProducts(prev => [createdProduct, ...prev]);
    }

    // Reset Studio
    setImageUri(null);
    setImageBase64(null);
    setListingQuantity('1');
    setAiResult(null);
    setArtisanNotes('');
    setPriceIdea('');

    Alert.alert(
      lang === 'hi' ? "सफलतापूर्वक प्रकाशित!" : "Listing Published!",
      lang === 'hi' ? "आपका शिल्प कलासेतु पर लाइव है। क्या आप इसे सीधे व्हाट्सएप पर साझा करना चाहते हैं?" : "Your craft is live on KalaSetu! Would you like to share it on WhatsApp to start selling immediately?",
      [
        {
          text: lang === 'hi' ? "📲 व्हाट्सएप पर साझा करें" : "📲 Share on WhatsApp",
          onPress: () => {
            shareProductToWhatsApp(createdProduct);
            setActiveTab('market');
          }
        },
        { text: lang === 'hi' ? "बाज़ार देखें" : "View Market", onPress: () => setActiveTab('market') }
      ]
    );
  };

  // Share product listing directly to any buyer/group on WhatsApp
  const shareProductToWhatsApp = (product: { name: string; price: number; category?: string; artisan_name?: string; artisan_location?: string; id?: number }) => {
    const text = `🏺 *${product.name}*\n` +
      `💰 *Price:* ₹${Number(product.price).toLocaleString('en-IN')}\n` +
      `🧵 *Craft Category:* ${product.category || 'Handcrafted Artisan'}\n` +
      `📍 *Artisan:* ${product.artisan_name || 'KalaSetu Artisan'} (${product.artisan_location || 'India'})\n` +
      `✅ *Verified by KalaSetu AI & MoSJE*\n\n` +
      `Direct artisan order via KalaSetu. Tap to view & order: https://kalasetu.in/p/${product.id || ''}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const webFallback = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(webFallback);
    }).catch(() => Linking.openURL(webFallback));
  };

  // Share Institutional RFQ Pitch via WhatsApp
  const shareRfqPitchToWhatsApp = () => {
    const text = `📋 *KalaSetu Institutional Procurement Pitch*\n\n` +
      `🏺 *Product:* ${bulkProductName || 'Handcrafted Artisan Collection'}\n` +
      `🏷️ *Craft Category:* ${bulkCategory || 'Handicrafts'} (HSN: ${bulkHsnCode}, GST: ${bulkGstRate})\n` +
      `📦 *Production Capacity:* ${bulkQuantity || '10'} units\n` +
      `💰 *Wholesale Unit Price:* ₹${Number(bulkUnitPrice || '250').toLocaleString('en-IN')}\n` +
      `⏱️ *Dispatch Lead Time:* ${bulkLeadTime || '7-15 working days'}\n` +
      `🏢 *Target Buyer:* ${bulkBuyerType || 'Institutional'}\n` +
      `📝 *Specifications & Packaging:* ${bulkNeed || 'High-quality artisan crafted items ready for bulk dispatch.'}\n\n` +
      `🤝 *Prepared via KalaSetu Institutional Desk*\n` +
      `MoSJE Beneficiary Verified | Compliance Ready`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const webFallback = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Linking.openURL(webFallback);
    }).catch(() => Linking.openURL(webFallback));
  };

  // Open Compliance Modal for GeM CSV or ONDC Beckn JSON preview
  const openComplianceModal = async (tab: 'gem' | 'ondc') => {
    setComplianceTab(tab);
    setComplianceModalVisible(true);
    setIsComplianceLoading(true);
    try {
      if (tab === 'gem') {
        const res = await fetch(`${getBackendUrl()}/api/export/gem-csv`);
        if (res.ok) {
          const txt = await res.text();
          setComplianceCsvData(txt);
        }
      } else if (tab === 'ondc') {
        const res = await fetch(`${getBackendUrl()}/api/export/ondc`);
        if (res.ok) {
          const json = await res.json();
          setComplianceJsonData(json);
        }
      }
    } catch (e) {
      console.warn('Compliance fetch error:', e);
    } finally {
      setIsComplianceLoading(false);
    }
  };

  // Open WhatsApp Link directly from phone
  const openWhatsApp = (phone: string, productName: string, price: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hello! I saw your handcrafted '${productName}' on KalaSetu marketplace for ₹${price}. I would like to buy it directly from you.`);
    const url = `whatsapp://send?phone=${cleanPhone}&text=${message}`;
    const webFallback = `https://wa.me/${cleanPhone}?text=${message}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webFallback);
      }
    });
  };

  // Filtered Products - hide sold-out (quantity <= 0) items
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.artisan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const inStock = Number(p.quantity ?? 1) > 0;
    return matchesCategory && matchesSearch && inStock;
  });

  const categoriesList = ['All', 'Handloom & Textiles', 'Pottery & Terracotta', 'Brass & Metalcraft', 'Woodcraft', 'Cane & Bamboo', 'Folk Art & Painting'];

  const renderMainContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.homeContainer}>
            <View style={styles.homeHero}>
              <Text style={styles.homeKicker}>KalaSetu x SIH26090</Text>
              <Text style={styles.homeTitle}>{tx('homeTitle')}</Text>
              <Text style={styles.homeSubtitle}>{tx('homeSubtitle')}</Text>
              <View style={styles.homeActionRow}>
                <TouchableOpacity style={styles.primaryAction} onPress={() => setActiveTab('studio')}>
                  <Text style={styles.primaryActionText}>{tx('startCataloging')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => setActiveTab('market')}>
                  <Text style={styles.secondaryActionText}>{tx('exploreCrafts')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.homeImageCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=1200&q=80' }} style={styles.homeImage} />
              <Text style={styles.homeImageCaption}>{lang === 'hi' ? 'टेराकोटा • मधुबनी • ढोकरा • ' : lang === 'kn' ? 'ಟೆರಾಕೋಟಾ • ಮಧುಬನಿ • ಧೋಕ್ರಾ • ' : 'Terracotta • Madhubani • Dhokra • '}{t.mosjeVerified}</Text>
            </View>
            <Text style={styles.homeSectionTitle}>{tx('connectedPaths')}</Text>
            <View style={styles.homeFeatureGrid}>
              <View style={styles.homeFeatureCard}>
                <Text style={styles.homeFeatureIcon}>🪡</Text>
                <Text style={styles.homeFeatureTitle}>{tx('forArtisans')}</Text>
                <Text style={styles.homeFeatureText}>{tx('artisanPath')}</Text>
              </View>
              <View style={styles.homeFeatureCard}>
                <Text style={styles.homeFeatureIcon}>🏛️</Text>
                <Text style={styles.homeFeatureTitle}>{tx('forBuyers')}</Text>
                <Text style={styles.homeFeatureText}>{tx('buyerPath')}</Text>
              </View>
            </View>
            <Text style={styles.homeSectionTitle}>{tx('aiCataloging')}</Text>
            <View style={styles.homeFeatureCard}>
              <Text style={styles.homeFeatureTitle}>{tx('aiCatalogingText')}</Text>
              <Text style={styles.homeFeatureText}>{tx('homeSubtitle')}</Text>
            </View>
          </View>
        );

      case 'studio':
        return (
          <View style={styles.studioContainer}>
            <View style={styles.offlineDraftBanner}>
              <View style={styles.offlineDraftHeader}>
                <Text style={styles.offlineDraftTitle}>{tx('saveDraft')}</Text>
                <Text style={styles.offlineDraftBadge}>{catalogDrafts.length} saved</Text>
              </View>
              <Text style={styles.offlineDraftText}>{tx('bulkHelp')}</Text>
              <TouchableOpacity style={styles.offlineDraftSaveButton} onPress={saveCatalogDraft}>
                <Text style={styles.offlineDraftSaveText}>{tx('saveDraft')}</Text>
              </TouchableOpacity>
              {catalogDrafts.map(draft => (
                <View key={draft.id} style={styles.offlineDraftRow}>
                  <View style={styles.offlineDraftInfo}>
                    <Text style={styles.offlineDraftName}>{draft.title}</Text>
                    <Text style={styles.offlineDraftDate}>{new Date(draft.savedAt).toLocaleString()}</Text>
                  </View>
                  <View style={styles.offlineDraftActions}>
                    <TouchableOpacity onPress={() => restoreCatalogDraft(draft)}>
                      <Text style={styles.offlineDraftRestore}>{tx('restoreDraft')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeCatalogDraft(draft.id)}>
                      <Text style={styles.offlineDraftRemove}>{tx('removePublished')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }} numberOfLines={1}>
                  API: {getBackendUrl()}
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#EEF2F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                onPress={() => {
                  const current = getBackendUrl();
                  const devUrl = getDevBackendUrl();
                  const next = current === devUrl ? CLOUD_BACKEND_URL : devUrl;
                  setBackendUrl(next);
                  Alert.alert("Server Switched", `Active backend server is now:\n${next}`);
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.primary }}>⚡ Switch Server</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardStepTitle}>{t.step1Title}</Text>
              <Text style={styles.cardStepSub}>{t.step1Sub}</Text>
              <View style={styles.presetsRow}>
                <Text style={styles.presetLabel}>{t.demoSampleTitle}</Text>
                <View style={styles.presetButtons}>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(0)}>
                    <Text style={styles.presetChipText}>🏺 Terracotta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(1)}>
                    <Text style={styles.presetChipText}>🐘 Brass</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.presetChip} onPress={() => loadDemoPreset(2)}>
                    <Text style={styles.presetChipText}>🧵 Handloom</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.imageBox}>
                {imageUri ? (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: imageUri }}
                      style={[styles.previewImage, isEnhanced && styles.enhancedImage]}
                      resizeMode="cover"
                      onError={(e) => {
                        console.warn("Failed to render preview image:", e.nativeEvent?.error);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.removeImageBadge}
                      onPress={() => {
                        setImageUri(null);
                        setImageBase64(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.removeImageBadgeText}>✕ {lang === 'hi' ? 'हटाएं' : 'Remove'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>📸</Text>
                    <Text style={styles.placeholderText}>{tx('placeholderPhoto')}</Text>
                  </View>
                )}
              </View>
              <View style={styles.enhancerRow}>
                <View>
                  <Text style={styles.enhancerTitle}>💡 {t.studioEnhancer}</Text>
                  <Text style={styles.enhancerSub}>{tx('professionalLighting')}</Text>
                </View>
                <Switch value={isEnhanced} onValueChange={setIsEnhanced} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFFFFF" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{tx('quantityToSell')}</Text>
                <TextInput style={styles.textInput} value={listingQuantity} onChangeText={setListingQuantity} keyboardType="number-pad" maxLength={2} placeholderTextColor={Colors.placeholder} />
                <Text style={styles.helperText}>{tx('listingLimit')}</Text>
              </View>
              <View style={styles.actionButtonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
                  <Text style={styles.primaryButtonText}>📷 {t.btnCamera}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
                  <Text style={styles.secondaryButtonText}>🖼️ {t.btnGallery}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.formFields}>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.artisanName}</Text><TextInput style={styles.textInput} value={artisanName} onChangeText={setArtisanName} placeholder="Enter your full name" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.artisanLocation}</Text><TextInput style={styles.textInput} value={artisanLocation} onChangeText={setArtisanLocation} placeholder="City, State (e.g. Madhubani, Bihar)" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.artisanPhone}</Text><TextInput style={styles.textInput} value={artisanPhone} onChangeText={setArtisanPhone} keyboardType="phone-pad" placeholder="10-digit mobile number" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.priceIdea}</Text><TextInput style={styles.textInput} value={priceIdea} onChangeText={setPriceIdea} keyboardType="numeric" placeholder="Expected price (e.g. 500)" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>{t.artisanNotes}</Text>
                    <TouchableOpacity style={[styles.voiceButton, isListening && styles.voiceButtonActive]} onPress={toggleVoiceInput}>
                      <Text style={styles.voiceButtonText}>{isListening ? `⏹️ ${tx('voiceListening')}` : `🎙️ ${tx('voiceInput')}`}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.voiceLanguageRow}>
                    {([['en-IN', 'English'], ['kn-IN', 'ಕನ್ನಡ'], ['hi-IN', 'हिन्दी']] as const).map(([code, label]) => (
                      <TouchableOpacity key={code} style={[styles.voiceLanguageChip, voiceLanguage === code && styles.voiceLanguageChipActive]} onPress={() => setVoiceLanguage(code)}>
                        <Text style={[styles.voiceLanguageChipText, voiceLanguage === code && styles.voiceLanguageChipTextActive]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.descriptionInputWrap}>
                    <TextInput style={[styles.textInput, styles.textArea, styles.descriptionInput]} value={artisanNotes} onChangeText={setArtisanNotes} multiline placeholder={t.artisanNotesPlaceholder} placeholderTextColor={Colors.placeholder} />
                    <TouchableOpacity style={[styles.descriptionMicButton, isListening && styles.voiceButtonActive]} onPress={toggleVoiceInput} accessibilityLabel={isListening ? tx('voiceListening') : tx('voiceInput')}>
                      <Text style={styles.descriptionMicText}>{isListening ? '⏹️' : '🎙️'}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.voiceHint}>{tx('voiceTranslationHint')}</Text>
                  {speechError ? <Text style={styles.errorText}>{speechError}</Text> : null}
                </View>
              </View>
              <TouchableOpacity style={[styles.analyzeButton, (!imageUri || isAnalyzing) && styles.disabledButton]} onPress={handleAnalyze} disabled={!imageUri || isAnalyzing}>
                {isAnalyzing ? (
                  <View style={styles.loadingRow}><ActivityIndicator color="#FFFFFF" /><Text style={styles.analyzeButtonText}>{analysisProgress || t.analyzing}</Text></View>
                ) : (
                  <Text style={styles.analyzeButtonText}>{t.btnAnalyze}</Text>
                )}
              </TouchableOpacity>
            </View>
            {aiResult && (
              <View style={[styles.card, styles.reviewCard]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.cardStepTitle}>{t.step2Title}</Text>
                  <View style={{ backgroundColor: aiResult.is_ai_simulated ? '#FFF3E0' : '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: aiResult.is_ai_simulated ? '#FFE0B2' : '#C8E6C9' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: aiResult.is_ai_simulated ? '#E65100' : '#2E7D32' }}>
                      {aiResult.is_ai_simulated ? '⚠️ Heuristic Mode' : '✨ ' + (aiResult.ai_engine || 'Google Gemini AI')}
                    </Text>
                  </View>
                </View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.productTitle}</Text><TextInput style={styles.textInput} value={editTitle} onChangeText={setEditTitle} placeholder="Craft Title (e.g. Hand-Carved Sheesham Elephant)" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>{t.category}</Text><TextInput style={styles.textInput} value={editCategory} onChangeText={setEditCategory} placeholder="Craft Category (e.g. Woodcraft)" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.pricingBox}>
                  <Text style={styles.pricingTitle}>⚖️ {t.pricingAssistant}</Text>
                  <Text style={styles.pricingRange}>{t.fairRange} <Text style={styles.boldText}>₹{aiResult.pricing.fair_min} - ₹{aiResult.pricing.fair_max}</Text></Text>
                  <Text style={styles.pricingJustification}>{aiResult.pricing.justification}</Text>
                  <TouchableOpacity style={styles.applyPriceBtn} onPress={() => setEditPrice(String(aiResult.pricing.suggested))}>
                    <Text style={styles.applyPriceBtnText}>{t.btnApplyPrice} (₹{aiResult.pricing.suggested})</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}><Text style={styles.inputLabel}>Final Selling Price (₹)</Text><TextInput style={[styles.textInput, styles.boldPriceInput]} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" placeholder="e.g. 650" placeholderTextColor={Colors.placeholder} /></View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t.tags}</Text>
                  <View style={styles.tagsContainer}>{tags.map((tag, idx) => (<TouchableOpacity key={idx} style={styles.tagChip} onPress={() => handleRemoveTag(idx)}><Text style={styles.tagText}>#{tag} ×</Text></TouchableOpacity>))}</View>
                  <View style={styles.addTagRow}>
                    <TextInput style={[styles.textInput, styles.addTagInput]} value={newTag} onChangeText={setNewTag} placeholder={tx('addTag')} placeholderTextColor={Colors.placeholder} />
                    <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}><Text style={styles.addTagBtnText}>+ Add</Text></TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.descHeaderRow}>
                    <Text style={styles.inputLabel}>{t.descEn}</Text>
                    <TouchableOpacity style={styles.speakerBtn} onPress={() => toggleSpeech(editDescEn, voiceLanguage)}><Text style={styles.speakerBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${t.listenDesc}`}</Text></TouchableOpacity>
                  </View>
                  <TextInput style={[styles.textInput, styles.textArea]} value={editDescEn} onChangeText={setEditDescEn} multiline placeholder="Describe the craft, material, and heritage technique in English..." placeholderTextColor={Colors.placeholder} />
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.descHeaderRow}>
                    <Text style={styles.inputLabel}>{t.descHi}</Text>
                    <TouchableOpacity style={styles.speakerBtn} onPress={() => toggleSpeech(editDescHi, voiceLanguage)}><Text style={styles.speakerBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${t.listenDesc}`}</Text></TouchableOpacity>
                  </View>
                  <TextInput style={[styles.textInput, styles.textArea]} value={editDescHi} onChangeText={setEditDescHi} multiline placeholder="शिल्प, सामग्री और पारंपरिक तकनीक का हिंदी में विवरण..." placeholderTextColor={Colors.placeholder} />
                </View>
                <TouchableOpacity style={[styles.publishButton, isPublishing && styles.disabledButton]} onPress={handlePublish} disabled={isPublishing}>{isPublishing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>{t.btnPublish}</Text>}</TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={saveCatalogDraft}><Text style={styles.secondaryButtonText}>{tx('saveDraft')}</Text></TouchableOpacity>
              </View>
            )}
          </View>
        );

      case 'market':
        return (
          <View style={styles.marketContainer}>
            <View style={styles.marketHero}>
              <Text style={styles.marketHeroTitle}>{t.marketTitle}</Text>
              <Text style={styles.marketHeroSub}>{t.marketSub}</Text>
              <TouchableOpacity style={styles.marketSpeakButton} onPress={() => toggleSpeech(`${t.marketTitle}. ${t.marketSub}. ${t.directToArtisan}. ${t.mosjeVerified}`, speechLocale)}>
                <Text style={styles.marketSpeakButtonText}>{isSpeaking ? '⏹ Stop' : `🔊 ${tx('tapToSpeak')}`}</Text>
              </TouchableOpacity>
              <View style={styles.guaranteeRow}>
                <Text style={styles.guaranteeText}>✓ {t.directToArtisan}</Text>
                <Text style={styles.guaranteeText}>✓ {t.mosjeVerified}</Text>
              </View>
            </View>
            <View style={styles.bulkLeadCard}>
              <Text style={styles.bulkLeadTitle}>{tx('bulkLinkage')}</Text>
              <Text style={styles.bulkLeadText}>{tx('bulkSubtitle')}</Text>
              <TouchableOpacity style={styles.bulkLeadButton} onPress={() => setActiveTab('institutional')}>
                <Text style={styles.bulkLeadButtonText}>{tx('prepareRfq')}</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.searchBar} placeholder={t.searchPlaceholder} value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={Colors.placeholder} />
            <View style={styles.deliveryCard}>
              <Text style={styles.deliveryTitle}>📦 {tx('deliveryDetails')}</Text>
              {([
                ['recipientName', 'Enter full name (e.g. Aarav Sharma)'],
                ['recipientPhone', 'Enter 10-digit mobile number (e.g. 9800112233)'],
                ['addressLine', 'Enter house no, street, locality'],
                ['city', 'Enter city (e.g. Bhopal)'],
                ['state', 'Enter state (e.g. Madhya Pradesh)'],
                ['pincode', 'Enter 6-digit pincode (e.g. 462001)']
              ] as const).map(([key, placeholder]) => (
                <TextInput key={key} style={styles.deliveryInput} placeholder={placeholder} value={deliveryDetails[key]} onChangeText={value => setDeliveryDetails(prev => ({ ...prev, [key]: value }))} keyboardType={key === 'pincode' || key === 'recipientPhone' ? 'phone-pad' : 'default'} placeholderTextColor={Colors.placeholder} />
              ))}
            </View>
            {!!orderActionMessage && <Text style={styles.orderActionMessage}>{orderActionMessage}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesBar}>
              {categoriesList.map((cat, idx) => (
                <TouchableOpacity key={idx} style={[styles.catChip, selectedCategory === cat && styles.catChipActive]} onPress={() => setSelectedCategory(cat)}>
                  <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.productsFeed}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageWrapper}>
                    <Image source={{ uri: product.image_url }} style={styles.productImage} />
                    <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{product.category}</Text></View>
                    <View style={styles.verifiedBadge}><Text style={styles.verifiedBadgeText}>★ MoSJE</Text></View>
                    <View style={styles.priceBadge}><Text style={styles.priceBadgeText}>₹{product.price}</Text></View>
                  </View>
                  <View style={styles.productCardBody}>
                    <Text style={styles.productCardTitle}>{product.name}</Text>
                    <Text style={styles.productArtisan}>👤 {product.artisan_name} &bull; {product.artisan_location}</Text>
                    <Text style={styles.productDesc} numberOfLines={2}>{lang === 'hi' && product.description_hi ? product.description_hi : product.description_en}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingText}>★ {Number(product.rating || 4.5).toFixed(1)}</Text>
                      <Text style={styles.reviewText}>{product.reviews?.length || 0} {tx('reviews')}</Text>
                    </View>
                    <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewProductId(reviewProductId === product.id ? null : product.id)}>
                      <Text style={styles.reviewButtonText}>{tx('rateReview')}</Text>
                    </TouchableOpacity>
                    {reviewProductId === product.id && (
                      <View style={styles.reviewEditor}>
                        <View style={styles.reviewStarsRow}>{[1,2,3,4,5].map(star => (<TouchableOpacity key={star} onPress={() => setReviewRating(star)}><Text style={[styles.reviewStar, star <= reviewRating && styles.reviewStarActive]}>★</Text></TouchableOpacity>))}</View>
                        <TextInput style={styles.reviewInput} value={reviewComment} onChangeText={setReviewComment} placeholder={tx('writeExperience')} multiline placeholderTextColor={Colors.placeholder} />
                        <TouchableOpacity style={styles.submitReviewButton} onPress={() => submitReview(product)} disabled={isSubmittingReview}>{isSubmittingReview ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitReviewButtonText}>{tx('submitReview')}</Text>}</TouchableOpacity>
                      </View>
                    )}
                    {product.image_gallery && product.image_gallery.length > 1 ? (
                      <View style={styles.galleryRow}>{product.image_gallery.slice(0, 3).map((url, idx) => (<Image key={`${url}-${idx}`} source={{ uri: url }} style={styles.galleryThumb} />))}</View>
                    ) : null}
                    <Text style={styles.quantityLabel}>Quantity for this order ({Math.max(1, Number(product.quantity ?? 10))} available)</Text>
                    <View style={styles.quantityOptions}>{Array.from({ length: Math.max(0, Number(product.quantity ?? 10)) }, (_, index) => String(index + 1)).map(option => (
                      <TouchableOpacity key={`${product.id}-${option}`} style={[styles.quantityOption, buyQuantity === option && styles.quantityOptionActive]} onPress={() => setBuyQuantity(option)}>
                        <Text style={[styles.quantityOptionText, buyQuantity === option && styles.quantityOptionTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    ))}</View>
                    <View style={styles.inlineActionRow}>
                      <TouchableOpacity style={styles.inlineActionButton} onPress={() => toggleWishlist(product.id)}><Text style={styles.inlineActionButtonText}>{wishlist.includes(product.id) ? t.removeFromWishlist : t.addToWishlist}</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.inlineActionButtonPrimary, isPlacingOrder && styles.disabledButton]} onPress={() => requestOrder(product)} disabled={isPlacingOrder || (Number(product.quantity ?? 10) <= 0)}><Text style={styles.inlineActionButtonText}>{isPlacingOrder ? 'Placing...' : Number(product.quantity ?? 10) <= 0 ? 'Sold Out' : t.buyNow}</Text></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.whatsAppButton} onPress={() => openWhatsApp(product.artisan_phone || '+919876543210', product.name, product.price)}>
                      <Text style={styles.whatsAppButtonText}>💬 {t.btnWhatsApp}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.whatsAppButton, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 }]} onPress={() => shareProductToWhatsApp(product)}>
                      <Text style={[styles.whatsAppButtonText, { color: '#166534' }]}>📲 Share on WhatsApp</Text>
                    </TouchableOpacity>
                    {isLoggedIn && currentUser && product.owner_user_id === currentUser.id && (<TouchableOpacity style={styles.deleteProductButton} onPress={() => removeOwnProduct(product)}><Text style={styles.deleteProductButtonText}>Delete my listing</Text></TouchableOpacity>)}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'institutional':
        return (
          <View style={styles.marketContainer}>
            <View style={styles.institutionalHero}><Text style={styles.institutionalKicker}>{tx('bulkHero')}</Text><Text style={styles.institutionalTitle}>{tx('bulkTitle')}</Text><Text style={styles.institutionalSubtitle}>{tx('bulkSubtitle')}</Text></View>
            <View style={styles.card}>
              <Text style={styles.stepLabel}>{tx('step')} 1</Text>
              <Text style={styles.profileSectionTitle}>{tx('createBulkRequest')}</Text>
              <Text style={styles.bulkHelpText}>{tx('bulkHelp')}</Text>

              {/* ✨ AI Institutional Smart Assistant Box */}
              <View style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>✨</Text>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#0F172A' }}>AI Procurement Assistant</Text>
                  </View>
                  <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#0369A1' }}>Gemini AI Ready</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 16, marginBottom: 10 }}>
                  Let AI generate your procurement title, HSN code, institutional description, and packaging specs. You just enter your workshop capacity!
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1.2, backgroundColor: '#EA580C', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    onPress={handleGenerateBulkAi}
                    disabled={isGeneratingBulkAi}
                  >
                    {isGeneratingBulkAi ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 13 }}>🪄</Text>
                        <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>AI Auto-Fill Pitch</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 }}
                    onPress={() => setCraftPickerModalVisible(true)}
                  >
                    <Text style={{ fontSize: 13 }}>📦</Text>
                    <Text style={{ color: '#334155', fontWeight: '700', fontSize: 11 }}>From My Crafts</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 }}>PRODUCT / CRAFT TITLE (AUTO-FILLED BY AI)</Text>
              <TextInput style={styles.textInput} value={bulkProductName} onChangeText={setBulkProductName} placeholder="e.g. Handcrafted Brass Dhokra Table Lamp" placeholderTextColor={Colors.placeholder} />

              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 }}>CRAFT CATEGORY & COMPLIANCE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput style={[styles.textInput, { flex: 1, marginBottom: 0 }]} value={bulkCategory} onChangeText={setBulkCategory} placeholder={t.category} placeholderTextColor={Colors.placeholder} />
                <View style={{ backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569' }}>HSN: {bulkHsnCode}</Text>
                  <Text style={{ fontSize: 9, color: '#64748B' }}>GST: {bulkGstRate}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 }}>WORKSHOP PRODUCTION CAPACITY</Text>
              <View style={styles.bulkInputRow}>
                <TextInput style={[styles.textInput, styles.bulkHalfInput]} value={bulkQuantity} onChangeText={setBulkQuantity} placeholder="Production Units (e.g. 100)" keyboardType="numeric" placeholderTextColor={Colors.placeholder} />
                <TextInput style={[styles.textInput, styles.bulkHalfInput]} value={bulkUnitPrice} onChangeText={setBulkUnitPrice} placeholder="Wholesale Price ₹" keyboardType="numeric" placeholderTextColor={Colors.placeholder} />
              </View>
              <TextInput style={styles.textInput} value={bulkLeadTime} onChangeText={setBulkLeadTime} placeholder="Production & dispatch lead time (e.g. 12-15 days)" placeholderTextColor={Colors.placeholder} />

              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 }}>TARGET BUYER & ARTISAN DETAILS</Text>
              <TextInput style={styles.textInput} value={bulkBuyerType} onChangeText={setBulkBuyerType} placeholder={tx('buyerType')} placeholderTextColor={Colors.placeholder} />
              <TextInput style={styles.textInput} value={currentUser?.name || authName} placeholder={t.fullName} editable={!isLoggedIn} placeholderTextColor={Colors.placeholder} />
              <TextInput style={styles.textInput} value={currentUser?.email || authEmail} placeholder={`${t.email} for follow-up`} keyboardType="email-address" editable={!isLoggedIn} placeholderTextColor={Colors.placeholder} />

              <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 4 }}>INSTITUTIONAL PITCH, PACKAGING & SPECS (AI GENERATED)</Text>
              <TextInput style={[styles.textInput, styles.textArea, { minHeight: 90 }]} value={bulkNeed} onChangeText={setBulkNeed} multiline placeholder="Packaging, customization, quality certifications..." placeholderTextColor={Colors.placeholder} />

              <TouchableOpacity style={styles.primaryAction} onPress={handleBulkSupport}><Text style={styles.primaryActionText}>{tx('submitRfq')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={saveBulkDraft}><Text style={styles.secondaryButtonText}>{tx('saveDraft')}</Text></TouchableOpacity>
              {bulkDrafts.length > 0 && (<View><Text style={styles.helperText}>{bulkDrafts.length} bulk draft(s) saved on this device.</Text><TouchableOpacity onPress={() => restoreBulkDraft(bulkDrafts[0])}><Text style={styles.offlineDraftRestore}>{tx('restoreDraft')}</Text></TouchableOpacity></View>)}
            </View>
            <View style={styles.card}><Text style={styles.stepLabel}>{tx('step')} 2</Text><Text style={styles.profileSectionTitle}>{tx('buyerReady')}</Text><Text style={styles.bulkHelpText}>{tx('buyerReadyHelp')}</Text><View style={styles.bulkPricingCard}><View style={styles.bulkPricingHeader}><Text style={styles.bulkPricingTitle}>{tx('pricingTiers')}</Text><Text style={styles.bulkPricingBadge}>{tx('wholesaleReady')}</Text></View><Text style={styles.bulkPricingHint}>Based on {bulkQuantityNumber || 0} units at ₹{bulkUnitPriceNumber.toLocaleString('en-IN')} base price</Text>{bulkPricingTiers.map(tier => (<View key={tier.volume} style={styles.bulkPricingRow}><Text style={styles.bulkPricingVolume}>{tier.volume}</Text><Text style={styles.bulkPricingPrice}>₹{Math.round(tier.price).toLocaleString('en-IN')}</Text><Text style={[styles.bulkPricingMargin, bulkQuantityNumber < tier.minimum && styles.bulkPricingUnavailable]}>{bulkQuantityNumber >= tier.minimum ? tier.margin : `Needs ${tier.minimum}+`}</Text></View>))}</View><View style={styles.bulkToolRow}><TouchableOpacity style={styles.bulkToolButton} onPress={() => { if (!bulkQuantityNumber || !bulkUnitPriceNumber) { Alert.alert('Bulk pricing', 'Enter both quantity and unit price to calculate your live bulk total.'); return; } const tierIndex = bulkQuantityNumber >= 51 ? 2 : bulkQuantityNumber >= 11 ? 1 : 0; const tier = bulkPricingTiers[tierIndex]; const total = Math.round(tier.price) * bulkQuantityNumber; const savings = Math.max(0, Math.round((bulkUnitPriceNumber - tier.price) * bulkQuantityNumber)); Alert.alert('Bulk pricing', `${bulkQuantityNumber} units × ₹${Math.round(tier.price).toLocaleString('en-IN')} = ₹${total.toLocaleString('en-IN')}\nSavings: ₹${savings.toLocaleString('en-IN')} (${tier.margin})`); }}><Text style={styles.bulkToolText}>📊 Bulk pricing calculator</Text></TouchableOpacity><TouchableOpacity style={[styles.bulkToolButton, { backgroundColor: '#10B981' }]} onPress={shareRfqPitchToWhatsApp}><Text style={[styles.bulkToolText, { color: '#FFFFFF', fontWeight: '800' }]}>📲 Share RFQ to WhatsApp</Text></TouchableOpacity></View><View style={styles.bulkToolRow}><TouchableOpacity style={styles.bulkToolButton} onPress={() => openComplianceModal('gem')}><Text style={styles.bulkToolText}>📦 GeM-ready export</Text></TouchableOpacity><TouchableOpacity style={styles.bulkToolButton} onPress={() => openComplianceModal('ondc')}><Text style={styles.bulkToolText}>⚡ ONDC JSON</Text></TouchableOpacity></View></View>
            <View style={styles.card}><Text style={styles.stepLabel}>{tx('step')} 3</Text><Text style={styles.profileSectionTitle}>{tx('connectChannels')}</Text><Text style={styles.bulkHelpText}>{tx('connectHelp')}</Text><View style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 3 }}>🤝 Cluster Coordinator Handoff Mode</Text><Text style={{ fontSize: 11, color: '#78350F', lineHeight: 15 }}>Government (GeM) & ONDC platforms require verified entity onboarding (GSTIN, Udyam, DIC). KalaSetu packages compliant catalogs so your local Cluster Facilitator or Cooperative Lead can complete registration with zero data re-entry.</Text></View><View style={styles.bulkChannelRow}><TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://gem.gov.in/')}><Text style={styles.bulkToolText}>GeM ↗</Text></TouchableOpacity><TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://ondc.org/')}><Text style={styles.bulkToolText}>ONDC ↗</Text></TouchableOpacity><TouchableOpacity style={styles.bulkChannelButton} onPress={() => openBulkChannel('https://trifed.tribal.gov.in/')}><Text style={styles.bulkToolText}>TRIFED ↗</Text></TouchableOpacity></View><TouchableOpacity style={styles.secondaryAction} onPress={() => openBulkChannel('mailto:kalasetu24824.9@gmail.com?subject=KalaSetu%20Bulk%20Buyer%20Support')}><Text style={styles.secondaryActionText}>{tx('emailSupport')}</Text></TouchableOpacity></View>
          </View>
        );

      case 'account':
        return (
          <View style={styles.marketContainer}>
            {!isLoggedIn ? (
              <View style={styles.authCard}>

                {/* ── Brand Header ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center', shadowColor: '#EA580C', shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>क</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                      Sign in to KalaSetu
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      Access your artisan studio or buyer marketplace
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#FEF9C3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#FDE047' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#A16207' }}>SIH26090</Text>
                  </View>
                </View>

                {/* ── Demo Access Banner ── */}
                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFEDD5', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>⚡</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#C2410C' }}>Demo Sign In Mode — Select a 1-click account or enter details below</Text>
                </View>

                {/* ── Method Tabs: Password | Gmail OTP | Mobile OTP ── */}
                <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 18 }}>
                  {(
                    [['password', '🔑', 'Password / PIN'], ['email', '✉️', 'Gmail OTP'], ['phone', '📱', 'Mobile OTP']] as const
                  ).map(([method, icon, label]) => (
                    <TouchableOpacity
                      key={method}
                      style={[{ flex: 1, paddingBottom: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 2 }, authMethod === method && { borderBottomColor: Colors.primary }]}
                      onPress={() => { setAuthMethod(method); setDevOtpNotice(''); setShowOtpSection(false); setAuthErrorNotice(''); }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: authMethod === method ? Colors.primary : '#94A3B8' }}>{icon} {label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ══════════════════════════════════════════ */}
                {/* METHOD 1: PASSWORD / PIN (DEFAULT)         */}
                {/* ══════════════════════════════════════════ */}
                {authMethod === 'password' && (
                  <View>
                    <Text style={styles.authFieldLabel}>Email Address or Mobile Number</Text>
                    <TextInput
                      style={styles.authInput}
                      value={authEmail}
                      onChangeText={setAuthEmail}
                      placeholder="demo@kalakriti.in or 9876543210"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={Colors.placeholder}
                    />

                    <Text style={styles.authFieldLabel}>Password / PIN</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 14, marginBottom: 12 }}>
                      <TextInput
                        style={{ flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A' }}
                        value={authPassword}
                        onChangeText={setAuthPassword}
                        placeholder="demo123"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        placeholderTextColor={Colors.placeholder}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>{showPassword ? '👁️ Hide' : '👁️ Show'}</Text>
                      </TouchableOpacity>
                    </View>

                    {authErrorNotice ? <View style={styles.authErrorBox}><Text style={styles.authErrorText}>⚠️ {authErrorNotice}</Text></View> : null}

                    <TouchableOpacity style={[styles.primaryAction, authLoading && { opacity: 0.7 }]} onPress={handleAuthSubmit} disabled={authLoading}>
                      {authLoading
                        ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ActivityIndicator color="#FFF" size="small" /><Text style={styles.primaryActionText}>Signing In...</Text></View>
                        : <Text style={styles.primaryActionText}>🔑 Sign In</Text>
                      }
                    </TouchableOpacity>

                    {/* 1-Click Demo Pills */}
                    <View style={styles.demoPillsBox}>
                      <Text style={styles.demoPillsLabel}>⚡ 1-Click Demo Accounts:</Text>
                      <View style={styles.demoPillsRow}>
                        <TouchableOpacity
                          style={styles.demoPill}
                          onPress={() => {
                            setAuthEmail('demo@kalakriti.in');
                            setAuthPassword('demo123');
                            setAuthRole('buyer');
                          }}
                        >
                          <Text style={styles.demoPillText}>🛍️ Buyer: demo@kalakriti.in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.demoPill}
                          onPress={() => {
                            setAuthEmail('artisan@kalakriti.in');
                            setAuthPassword('artisan123');
                            setAuthRole('artisan');
                          }}
                        >
                          <Text style={styles.demoPillText}>🎨 Artisan: artisan@kalakriti.in</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* METHOD 2: GMAIL / EMAIL OTP               */}
                {/* ══════════════════════════════════════════ */}
                {authMethod === 'email' && (
                  <View>
                    <View style={styles.authInfoBox}>
                      <Text style={styles.authInfoText}>📧 <Text style={{ fontWeight: '700' }}>Direct Inbox Delivery:</Text> Verification codes are dispatched directly to your Gmail inbox.</Text>
                    </View>

                    {!showOtpSection ? (
                      <View>
                        <Text style={styles.authFieldLabel}>Your Full Name</Text>
                        <TextInput
                          style={styles.authInput}
                          value={authName}
                          onChangeText={setAuthName}
                          placeholder="Enter your name (e.g. Ravi Kumar)"
                          autoCapitalize="words"
                          placeholderTextColor={Colors.placeholder}
                        />
                        <Text style={styles.authFieldLabel}>Gmail / Email Address</Text>
                        <TextInput style={styles.authInput} value={authEmail} onChangeText={setAuthEmail} placeholder="yourname@gmail.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.placeholder} />
                        {authErrorNotice ? <View style={styles.authErrorBox}><Text style={styles.authErrorText}>⚠️ {authErrorNotice}</Text></View> : null}
                        <TouchableOpacity style={[styles.primaryAction, authLoading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={authLoading}>
                          {authLoading
                            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color="#FFF" size="small" /><Text style={styles.primaryActionText}>Generating...</Text></View>
                            : <Text style={styles.primaryActionText}>📩 Generate OTP</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <View style={styles.otpSentBox}>
                          <Text style={styles.otpSentText}>✅ OTP auto-filled for <Text style={{ fontWeight: '800', color: '#0F172A' }}>{authEmail}</Text></Text>
                          <Text style={styles.otpSentSub}>Your OTP has been auto-filled below. Just tap Verify to continue.</Text>
                          {devOtpNotice ? (
                            <TouchableOpacity style={styles.demoPill} onPress={() => setAuthOtp(devOtpNotice)}>
                              <Text style={styles.demoPillText}>💡 OTP: {devOtpNotice} (Tap to fill)</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <Text style={styles.authFieldLabel}>6-Digit OTP</Text>
                        <TextInput style={[styles.authInput, { textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: 8 }]} value={authOtp} onChangeText={setAuthOtp} placeholder="123456" keyboardType="number-pad" maxLength={6} placeholderTextColor={Colors.placeholder} />
                        {authErrorNotice ? <View style={styles.authErrorBox}><Text style={styles.authErrorText}>⚠️ {authErrorNotice}</Text></View> : null}
                        <TouchableOpacity style={[styles.primaryAction, authLoading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={authLoading}>
                          {authLoading
                            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color="#FFF" size="small" /><Text style={styles.primaryActionText}>Verifying...</Text></View>
                            : <Text style={styles.primaryActionText}>✅ Verify & Access KalaSetu</Text>
                          }
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                          <TouchableOpacity onPress={() => setShowOtpSection(false)}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>← Change Email</Text></TouchableOpacity>
                          <TouchableOpacity onPress={handleSendOtp}><Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>Resend Code</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* METHOD 3: MOBILE NUMBER OTP               */}
                {/* ══════════════════════════════════════════ */}
                {authMethod === 'phone' && (
                  <View>
                    <View style={[styles.authInfoBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                      <Text style={[styles.authInfoText, { color: '#92400E' }]}>ℹ️ <Text style={{ fontWeight: '700' }}>Telecom SMS Notice:</Text> For guaranteed instant delivery switch to <Text style={{ fontWeight: '700' }}>Gmail OTP</Text> above.</Text>
                    </View>

                    {!showOtpSection ? (
                      <View>
                        <Text style={styles.authFieldLabel}>Your Full Name</Text>
                        <TextInput
                          style={styles.authInput}
                          value={authName}
                          onChangeText={setAuthName}
                          placeholder="Enter your name (e.g. Ravi Kumar)"
                          autoCapitalize="words"
                          placeholderTextColor={Colors.placeholder}
                        />
                        <Text style={styles.authFieldLabel}>10-Digit Mobile Number</Text>
                        <View style={{ flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden', marginBottom: 12 }}>
                          <View style={{ paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#E2E8F0', justifyContent: 'center' }}>
                            <Text style={{ fontWeight: '700', color: '#475569', fontSize: 13 }}>🇮🇳 +91</Text>
                          </View>
                          <TextInput style={{ flex: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '700', color: '#0F172A' }} value={authPhone.replace(/^\+91/, '')} onChangeText={v => setAuthPhone('+91' + v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" keyboardType="phone-pad" maxLength={10} placeholderTextColor={Colors.placeholder} />
                        </View>
                        {authErrorNotice ? <View style={styles.authErrorBox}><Text style={styles.authErrorText}>⚠️ {authErrorNotice}</Text></View> : null}
                        <TouchableOpacity style={[styles.primaryAction, authLoading && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={authLoading}>
                          {authLoading
                            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color="#FFF" size="small" /><Text style={styles.primaryActionText}>Generating...</Text></View>
                            : <Text style={styles.primaryActionText}>📲 Generate OTP</Text>
                          }
                        </TouchableOpacity>
                        {/* Quick Demo Phones */}
                        <View style={styles.demoPillsBox}>
                          <Text style={styles.demoPillsLabel}>⚡ Quick 1-Click Demo Numbers:</Text>
                          <View style={styles.demoPillsRow}>
                            <TouchableOpacity
                              style={styles.demoPill}
                              onPress={() => {
                                setAuthPhone('+919876543210');
                                setAuthRole('artisan');
                              }}
                            >
                              <Text style={styles.demoPillText}>🎨 Demo Artisan (+91 9876543210)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.demoPill}
                              onPress={() => {
                                setAuthPhone('+919800112233');
                                setAuthRole('buyer');
                              }}
                            >
                              <Text style={styles.demoPillText}>🛍️ Demo Buyer (+91 9800112233)</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <View style={styles.otpSentBox}>
                          <Text style={styles.otpSentText}>✅ OTP auto-filled for <Text style={{ fontWeight: '800', color: '#0F172A' }}>{authPhone}</Text></Text>
                          <Text style={styles.otpSentSub}>Your OTP has been auto-filled below. Just tap Verify to continue.</Text>
                          {devOtpNotice ? (
                            <TouchableOpacity style={styles.demoPill} onPress={() => setAuthOtp(devOtpNotice)}>
                              <Text style={styles.demoPillText}>💡 OTP: {devOtpNotice} (Tap to fill)</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <Text style={styles.authFieldLabel}>6-Digit OTP</Text>
                        <TextInput style={[styles.authInput, { textAlign: 'center', fontSize: 22, fontWeight: '900', letterSpacing: 8 }]} value={authOtp} onChangeText={setAuthOtp} placeholder="123456" keyboardType="number-pad" maxLength={6} placeholderTextColor={Colors.placeholder} />
                        {authErrorNotice ? <View style={styles.authErrorBox}><Text style={styles.authErrorText}>⚠️ {authErrorNotice}</Text></View> : null}
                        <TouchableOpacity style={[styles.primaryAction, authLoading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={authLoading}>
                          {authLoading
                            ? <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><ActivityIndicator color="#FFF" size="small" /><Text style={styles.primaryActionText}>Verifying...</Text></View>
                            : <Text style={styles.primaryActionText}>✅ Verify OTP & Access Workspace</Text>
                          }
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                          <TouchableOpacity onPress={() => setShowOtpSection(false)}><Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>← Change Number</Text></TouchableOpacity>
                          <TouchableOpacity onPress={handleSendOtp}><Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary }}>Resend OTP</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}



              </View>
            ) : (
              <View style={styles.profileCard}>
                <Text style={styles.marketHeroTitle}>{tx('account')}</Text>
                <Text style={styles.profileName}>{currentUser?.name}</Text>
                <Text style={styles.profileMeta}>{currentUser?.email} · {currentUser?.city}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountSubnav}>{([
                  ['profile', tx('profile')], ['history', tx('history')], ['orders', t.tabOrders], ['requests', tx('requests')], ['wishlist', t.tabWishlist], ['notifications', tx('notifications')], ['admin', tx('admin')]
                ] as const).map(([key, label]) => (
                  <TouchableOpacity key={key} style={[styles.accountSubnavButton, accountView === key && styles.accountSubnavButtonActive]} onPress={() => setAccountView(key)}><Text style={[styles.accountSubnavText, accountView === key && styles.accountSubnavTextActive]}>{label}</Text></TouchableOpacity>
                ))}</ScrollView>
                {accountView === 'profile' && (<View><Text style={styles.profileSectionTitle}>{tx('profile')}</Text><Text style={styles.notificationText}>{tx('role')}: {roleLabel}</Text><Text style={styles.notificationText}>{tx('publishedListings')}: {publishedProducts.length}</Text><Text style={styles.notificationText}>{tx('savedCrafts')}: {wishlist.length}</Text><TouchableOpacity style={styles.secondaryAction} onPress={handleLogout}><Text style={styles.secondaryActionText}>{tx('logout')}</Text></TouchableOpacity></View>)}
                {accountView === 'history' && (<View><Text style={styles.profileSectionTitle}>{tx('activityHistory')}</Text><Text style={styles.notificationText}>{orders.length} {tx('purchaseOrders')}</Text><Text style={styles.notificationText}>{publishedProducts.length} {tx('publishedListing')}</Text>{orders.slice(0, 5).map(order => <Text key={order.id} style={styles.notificationText}>• {order.productName} — {order.status}</Text>)}{publishedProducts.slice(0, 5).map(product => <Text key={`published-${product.id}`} style={styles.notificationText}>• Published: {product.name} — ₹{product.price}</Text>)}</View>)}
                {accountView === 'orders' && (
                  <View>
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                      <TouchableOpacity
                        style={[styles.orderSegmentBtn, orderSubTab === 'incoming' && styles.orderSegmentBtnActive]}
                        onPress={() => setOrderSubTab('incoming')}
                      >
                        <Text style={[styles.orderSegmentText, orderSubTab === 'incoming' && styles.orderSegmentTextActive]}>
                          📥 Incoming ({incomingOrders.length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.orderSegmentBtn, orderSubTab === 'mine' && styles.orderSegmentBtnActive]}
                        onPress={() => setOrderSubTab('mine')}
                      >
                        <Text style={[styles.orderSegmentText, orderSubTab === 'mine' && styles.orderSegmentTextActive]}>
                          🛍️ My Orders ({orders.filter(o => o.status.toLowerCase() !== 'cancelled').length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.orderSegmentBtn, orderSubTab === 'published' && styles.orderSegmentBtnActive]}
                        onPress={() => setOrderSubTab('published')}
                      >
                        <Text style={[styles.orderSegmentText, orderSubTab === 'published' && styles.orderSegmentTextActive]}>
                          🏷️ My Listings ({publishedProducts.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {orderSubTab === 'incoming' && (
                      <View>
                        <Text style={styles.profileSectionTitle}>Orders Requested by Others</Text>
                        <Text style={styles.helperText}>Buyer purchase requests for your published crafts.</Text>
                        {incomingOrders.length === 0 ? (
                          <Text style={styles.emptyStateText}>No incoming orders from buyers yet. When a buyer places an order for your craft, it will appear here for your confirmation.</Text>
                        ) : (
                          incomingOrders.map(order => {
                            const isPending = order.status.toLowerCase() === 'confirmed' || order.status.toLowerCase() === 'pending';
                            const isAccepted = order.status.toLowerCase() === 'accepted';
                            const isRejected = order.status.toLowerCase() === 'rejected';
                            const isDispatched = order.status.toLowerCase() === 'dispatched';
                            const isBusy = updatingOrderId === order.id;

                            return (
                              <View key={order.id} style={styles.orderCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                  <Text style={[styles.orderTitle, { flex: 1 }]}>{order.productName}</Text>
                                  <View style={[
                                    styles.orderStatusBadge,
                                    isAccepted && styles.orderBadgeAccepted,
                                    isRejected && styles.orderBadgeRejected,
                                    isPending && styles.orderBadgePending,
                                    isDispatched && styles.orderBadgeDispatched
                                  ]}>
                                    <Text style={[
                                      styles.orderStatusBadgeText,
                                      isAccepted && styles.orderBadgeTextAccepted,
                                      isRejected && styles.orderBadgeTextRejected,
                                      isPending && styles.orderBadgeTextPending,
                                      isDispatched && styles.orderBadgeTextDispatched
                                    ]}>
                                      {order.status}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.orderMeta}>💰 ₹{order.price} total • {order.quantity} unit(s)</Text>
                                <Text style={styles.orderMeta}>👤 Buyer: {order.customerName || 'Verified Buyer'}{order.customerPhone ? ` • 📱 ${order.customerPhone}` : ''}</Text>
                                {!!order.deliveryAddress && (
                                  <Text style={styles.orderMeta}>📦 Deliver to: {order.deliveryAddress}{order.city ? `, ${order.city}` : ''}{order.state ? `, ${order.state}` : ''}{order.pincode ? ` - ${order.pincode}` : ''}</Text>
                                )}
                                {!!order.cancelReason && (
                                  <Text style={[styles.orderMeta, { color: Colors.error }]}>Note: {order.cancelReason}</Text>
                                )}

                                {isPending && (
                                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                    <TouchableOpacity
                                      style={[styles.acceptOrderBtn, isBusy && styles.disabledButton]}
                                      onPress={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                                      disabled={isBusy}
                                    >
                                      {isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.acceptOrderBtnText}>✅ Accept Order</Text>}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.rejectOrderBtn, isBusy && styles.disabledButton]}
                                      onPress={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                                      disabled={isBusy}
                                    >
                                      <Text style={styles.rejectOrderBtnText}>❌ Reject</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}

                                {isAccepted && (
                                  <View style={{ marginTop: 10 }}>
                                    <TouchableOpacity
                                      style={[styles.dispatchOrderBtn, isBusy && styles.disabledButton]}
                                      onPress={() => handleUpdateOrderStatus(order.id, 'Dispatched')}
                                      disabled={isBusy}
                                    >
                                      <Text style={styles.dispatchOrderBtnText}>🚚 Mark as Dispatched</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}

                    {orderSubTab === 'mine' && (
                      <View>
                        <Text style={styles.profileSectionTitle}>{tx('ordersByMe')}</Text>
                        {orders.length === 0 ? (
                          <Text style={styles.emptyStateText}>{tx('noActiveOrders')}</Text>
                        ) : (
                          orders.map(order => (
                            <View key={order.id} style={styles.orderCard}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                <Text style={[styles.orderTitle, { flex: 1 }]}>{order.productName}</Text>
                                <View style={[
                                  styles.orderStatusBadge,
                                  order.status.toLowerCase() === 'cancelled' && styles.orderBadgeRejected
                                ]}>
                                  <Text style={[
                                    styles.orderStatusBadgeText,
                                    order.status.toLowerCase() === 'cancelled' && styles.orderBadgeTextRejected
                                  ]}>
                                    {order.status}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.orderMeta}>₹{order.price} · {order.quantity || 1} unit(s) · ETA: {order.eta || '2-4 days'}</Text>
                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                {order.status.toLowerCase() !== 'cancelled' && (
                                  <TouchableOpacity style={[styles.secondaryAction, { flex: 1, marginTop: 0 }]} onPress={() => handleCancelOrder(order.id)}>
                                    <Text style={styles.secondaryActionText}>{tx('cancelOrder')}</Text>
                                  </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                  style={[styles.deleteProductButton, { flex: 1, marginTop: 0, backgroundColor: '#FFF0F0', borderColor: '#FFCDD2' }]}
                                  onPress={() => handleDeleteOrder(order.id)}
                                >
                                  <Text style={[styles.deleteProductButtonText, { color: Colors.error }]}>🗑️ Delete</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
                    )}

                    {orderSubTab === 'published' && (
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={styles.profileSectionTitle}>{tx('ordersPublishedByMe')}</Text>
                          <TouchableOpacity
                            onPress={() => currentUser && refreshAccountData(currentUser)}
                            style={{ padding: 6 }}
                          >
                            <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>🔄 Refresh</Text>
                          </TouchableOpacity>
                        </View>
                        {publishedProducts.length === 0 ? (
                          <View style={styles.emptyStateCard}>
                            <Text style={styles.emptyStateText}>No products published yet. Create crafts in Studio tab to see them here.</Text>
                            <TouchableOpacity style={[styles.primaryAction, { marginTop: 12 }]} onPress={() => setActiveTab('studio')}>
                              <Text style={styles.primaryActionText}>📸 Go to Studio</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          publishedProducts.map(product => (
                            <View key={product.id} style={styles.orderCard}>
                              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                                {!!product.image_url && (
                                  <Image source={{ uri: product.image_url }} style={{ width: 64, height: 64, borderRadius: 8 }} />
                                )}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.orderTitle}>{product.name}</Text>
                                  <Text style={styles.orderMeta}>₹{product.price} · {product.category}</Text>
                                  <Text style={styles.orderMeta}>📦 Stock: {product.quantity || 1} · {product.mosje_verified ? '🏅 Verified' : 'Standard'}</Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[styles.deleteProductButton, { marginTop: 10 }, deletingProductId === product.id && styles.disabledButton]}
                                onPress={() => removeOwnProduct(product)}
                                disabled={deletingProductId === product.id}
                              >
                                <Text style={styles.deleteProductButtonText}>
                                  {deletingProductId === product.id ? 'Removing...' : `🗑️ ${tx('removePublished')}`}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                )}
                {accountView === 'requests' && (<View><Text style={styles.profileSectionTitle}>{tx('bulkRequests')}</Text><TextInput style={styles.textInput} value={bulkBuyerType} onChangeText={setBulkBuyerType} placeholder={tx('forBuyers')} placeholderTextColor={Colors.placeholder} /><TextInput style={[styles.textInput, styles.textArea]} value={bulkNeed} onChangeText={setBulkNeed} multiline placeholder={tx('bulkHelp')} placeholderTextColor={Colors.placeholder} /><TouchableOpacity style={styles.primaryAction} onPress={handleBulkSupport}><Text style={styles.primaryActionText}>{tx('sendRequest')}</Text></TouchableOpacity></View>)}
                {accountView === 'wishlist' && (<View><Text style={styles.profileSectionTitle}>{tx('savedCraftsTitle')}</Text>{products.filter(product => wishlist.includes(product.id)).map(product => <View key={product.id} style={styles.orderCard}><Text style={styles.orderTitle}>{product.name}</Text><Text style={styles.orderMeta}>₹{product.price} · {product.artisan_name}</Text></View>)}{wishlist.length === 0 && <Text style={styles.emptyStateText}>{tx('noSavedCrafts')}</Text>}</View>)}
                {accountView === 'notifications' && (<View style={styles.notificationCard}><Text style={styles.notificationTitle}>{tx('notifications')}</Text>{orders.length ? orders.slice(0, 5).map(order => <Text key={order.id} style={styles.notificationText}>{tx('orderUpdate')}: {order.productName} is {order.status}.</Text>) : <Text style={styles.notificationText}>{tx('noNotifications')}</Text>}</View>)}
                {accountView === 'admin' && (<View><Text style={styles.profileSectionTitle}>{tx('adminReview')}</Text>{!adminToken ? (<View><Text style={styles.bulkHelpText}>{tx('reviewRequests')}</Text><TextInput style={styles.textInput} value={adminEmail} onChangeText={setAdminEmail} placeholder={tx('adminEmail')} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.placeholder} /><TextInput style={styles.textInput} value={adminPassword} onChangeText={setAdminPassword} placeholder={tx('adminPassword')} secureTextEntry placeholderTextColor={Colors.placeholder} />{!!adminStatus && <Text style={styles.orderActionMessage}>{adminStatus}</Text>}<TouchableOpacity style={styles.primaryAction} onPress={handleAdminLogin}><Text style={styles.primaryActionText}>{tx('signInAdmin')}</Text></TouchableOpacity></View>) : (<View><View style={styles.adminHeaderRow}><Text style={styles.bulkHelpText}>{tx('requestQueue')}</Text><TouchableOpacity onPress={handleAdminLogout}><Text style={styles.offlineDraftRemove}>Logout</Text></TouchableOpacity></View>{adminRequests.length === 0 ? <Text style={styles.emptyStateText}>No institutional requests yet.</Text> : adminRequests.map(request => (<View key={request.id} style={styles.orderCard}><Text style={styles.orderTitle}>{request.artisan_name} · {request.product_category || 'Craft request'}</Text><Text style={styles.orderMeta}>{request.email} · Qty {request.quantity || 1} · {request.target_market || 'Bulk'}</Text><Text style={styles.orderMeta}>{request.requirements || 'No requirements'}</Text><View style={styles.adminStatusRow}>{['New', 'In Review', 'Approved', 'Rejected'].map(status => (<TouchableOpacity key={status} style={[styles.adminStatusButton, request.status === status && styles.adminStatusButtonActive]} onPress={() => handleAdminUpdate(request.id, status)}><Text style={[styles.adminStatusText, request.status === status && styles.adminStatusTextActive]}>{status}</Text></TouchableOpacity>))}</View></View>))}</View>)}</View>)}
              </View>
            )}
          </View>
        );

      case 'wishlist':
        return (
          <View style={styles.marketContainer}>
            <Text style={styles.marketHeroTitle}>{t.wishlistTitle}</Text>
            {wishlist.length === 0 ? (
              <View style={styles.emptyStateCard}><Text style={styles.emptyStateText}>Save products you like to build your shortlist.</Text></View>
            ) : (
              <View style={styles.productsFeed}>{products.filter(p => wishlist.includes(p.id)).map(product => (
                <View key={product.id} style={styles.productCard}><View style={styles.productImageWrapper}><Image source={{ uri: product.image_url }} style={styles.productImage} /><View style={styles.priceBadge}><Text style={styles.priceBadgeText}>₹{product.price}</Text></View></View><View style={styles.productCardBody}><Text style={styles.productCardTitle}>{product.name}</Text><TouchableOpacity style={styles.whatsAppButton} onPress={() => requestOrder(product)}><Text style={styles.whatsAppButtonText}>{t.buyNow}</Text></TouchableOpacity></View></View>
              ))}</View>
            )}
          </View>
        );

      case 'orders':
        return (
          <View style={styles.marketContainer}>
            <Text style={styles.marketHeroTitle}>{t.ordersTitle}</Text>
            {!isLoggedIn ? (
              <View style={styles.emptyStateCard}><Text style={styles.emptyStateText}>Sign in to track your purchase requests and delivery updates.</Text></View>
            ) : orders.length === 0 && publishedProducts.length === 0 ? (
              <View style={styles.emptyStateCard}><Text style={styles.emptyStateText}>No orders yet. Your recent requests will appear here.</Text></View>
            ) : (
              <View style={styles.productsFeed}>
                {incomingOrders.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.orderTitle}>📥 Orders Requested by Others ({incomingOrders.length})</Text>
                    {incomingOrders.map(order => {
                      const isPending = order.status.toLowerCase() === 'confirmed' || order.status.toLowerCase() === 'pending';
                      const isAccepted = order.status.toLowerCase() === 'accepted';
                      const isRejected = order.status.toLowerCase() === 'rejected';
                      const isDispatched = order.status.toLowerCase() === 'dispatched';
                      const isBusy = updatingOrderId === order.id;

                      return (
                        <View key={`feed-incoming-${order.id}`} style={styles.orderCard}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <Text style={[styles.orderTitle, { flex: 1 }]}>{order.productName}</Text>
                            <View style={[
                              styles.orderStatusBadge,
                              isAccepted && styles.orderBadgeAccepted,
                              isRejected && styles.orderBadgeRejected,
                              isPending && styles.orderBadgePending,
                              isDispatched && styles.orderBadgeDispatched
                            ]}>
                              <Text style={[
                                styles.orderStatusBadgeText,
                                isAccepted && styles.orderBadgeTextAccepted,
                                isRejected && styles.orderBadgeTextRejected,
                                isPending && styles.orderBadgeTextPending,
                                isDispatched && styles.orderBadgeTextDispatched
                              ]}>
                                {order.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.orderMeta}>💰 ₹{order.price} total • {order.quantity} unit(s)</Text>
                          <Text style={styles.orderMeta}>👤 Buyer: {order.customerName || 'Verified Buyer'}{order.customerPhone ? ` • 📱 ${order.customerPhone}` : ''}</Text>
                          {!!order.deliveryAddress && (
                            <Text style={styles.orderMeta}>📦 Deliver to: {order.deliveryAddress}{order.city ? `, ${order.city}` : ''}{order.state ? `, ${order.state}` : ''}{order.pincode ? ` - ${order.pincode}` : ''}</Text>
                          )}
                          {isPending && (
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                              <TouchableOpacity
                                style={[styles.acceptOrderBtn, isBusy && styles.disabledButton]}
                                onPress={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                                disabled={isBusy}
                              >
                                {isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.acceptOrderBtnText}>✅ Accept Order</Text>}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.rejectOrderBtn, isBusy && styles.disabledButton]}
                                onPress={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                                disabled={isBusy}
                              >
                                <Text style={styles.rejectOrderBtnText}>❌ Reject</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {isAccepted && (
                            <View style={{ marginTop: 10 }}>
                              <TouchableOpacity
                                style={[styles.dispatchOrderBtn, isBusy && styles.disabledButton]}
                                onPress={() => handleUpdateOrderStatus(order.id, 'Dispatched')}
                                disabled={isBusy}
                              >
                                <Text style={styles.dispatchOrderBtnText}>🚚 Mark as Dispatched</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.orderTitle}>{tx('ordersByMe')}</Text>
                {orders.length === 0 ? <Text style={styles.emptyStateText}>{tx('noActiveOrders')}</Text> : orders.map((order) => (
                  <View key={order.id} style={styles.orderCard}><Text style={styles.orderTitle}>{order.productName}</Text><Text style={styles.orderMeta}>₹{order.price} • {order.customerName}</Text><Text style={styles.orderMeta}>{t.orderStatus}: {order.status}</Text><Text style={styles.orderMeta}>{t.deliveryEta}: {order.eta}</Text><TextInput style={styles.searchBar} value={cancelReason} onChangeText={setCancelReason} placeholder={tx('cancelReasonPrompt')} placeholderTextColor={Colors.placeholder} /><TouchableOpacity style={styles.secondaryAction} onPress={() => handleCancelOrder(order.id)}><Text style={styles.secondaryActionText}>{tx('cancelOrder')}</Text></TouchableOpacity></View>
                ))}
                <Text style={styles.orderTitle}>{tx('ordersPublishedByMe')}</Text>
                {publishedProducts.length === 0 ? <Text style={styles.emptyStateText}>{tx('noPublishedProducts')}</Text> : publishedProducts.map(product => (
                  <View key={`published-${product.id}`} style={styles.orderCard}><Text style={styles.orderTitle}>{product.name}</Text><Text style={styles.orderMeta}>₹{product.price} • {product.category} • Qty {product.quantity || 0}</Text><TouchableOpacity style={styles.deleteProductButton} onPress={() => removeOwnProduct(product)}><Text style={styles.deleteProductButtonText}>{tx('removePublished')}</Text></TouchableOpacity></View>
                ))}
              </View>
            )}
          </View>
        );

      default:
        return <View style={styles.marketContainer} />;
    }
  };

  if (showSplash) {
    return <SplashScreenView onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Interactive Custom Animated Popup */}
      <InteractiveModal config={popupConfig} onClose={hideCustomPopup} />

      {Platform.OS === 'android' && (
        <View style={[styles.statusBarSpacer, { height: topSafeInset, backgroundColor: Colors.secondary }]} />
      )}

      {/* Top MoSJE Banner Strip */}
      <View style={styles.topStrip}>
        <View style={styles.topStripLeft}>
          <Text style={styles.sihTag}>SIH 2026</Text>
          <Text style={styles.topStripText}>{t.sihBadge}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={() => setIsLanguageMenuOpen(true)}>
          <Text style={styles.langBtnText}>🌐 {languageOptions.find(([code]) => code === lang)?.[1]} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <TouchableOpacity onPress={openHomeMarket} style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>क</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openHomeMarket}>
            <Text style={styles.appName}>KalaSetu</Text>
            <Text style={styles.appSub}>{t.appSubtitle}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.helpBtn} 
          onPress={() => toggleSpeech(lang === 'hi' ? 'नमस्ते! कलासेतु में आपका स्वागत है। यहां आप अपने हस्तशिल्प की फोटो अपलोड करें। हमारा एआई आपके उत्पाद का नाम, कीमत और विवरण खुद तैयार करेगा।' : 'Welcome to KalaSetu! Take a photo of your craft. Our AI will automatically identify the craft category, suggest fair pricing, and write SEO descriptions.', lang)}>
          <Text style={styles.helpBtnText}>{isSpeaking ? '⏹ Stop' : `🔊 ${lang === 'hi' ? 'मदद सुनें' : 'Audio Help'}`}</Text>
        </TouchableOpacity>
      </View>
      <Modal visible={isLanguageMenuOpen} transparent animationType="fade" onRequestClose={() => setIsLanguageMenuOpen(false)}>
        <TouchableOpacity style={styles.languageModalBackdrop} activeOpacity={1} onPress={() => setIsLanguageMenuOpen(false)}>
          <View style={styles.languageMenu}>
            <Text style={styles.languageMenuTitle}>{t.selectLanguage}</Text>
            {languageOptions.map(([code, label]) => (
              <TouchableOpacity
                key={code}
                style={[styles.languageMenuOption, lang === code && styles.languageMenuOptionActive]}
                onPress={() => void selectLanguage(code)}
              >
                <Text style={[styles.languageMenuOptionText, lang === code && styles.languageMenuOptionTextActive]}>{label}</Text>
                {lang === code && <Text style={styles.languageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Body: Scrollable Screen with Pull-to-Refresh */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          activeTab === 'market' ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefreshMarketplace}
              colors={['#EA580C']}
              tintColor="#EA580C"
              title="Pull to refresh marketplace..."
              titleColor="#EA580C"
            />
          ) : undefined
        }
      >
        {renderMainContent()}
      </ScrollView>

      {/* Bottom Tab Navigation Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bottomTabBar} contentContainerStyle={styles.bottomTabBarContent}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
          onPress={() => setActiveTab('home')}>
          <Text style={styles.tabIcon}>🏠</Text>
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>{tx('homeTab')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'studio' && styles.tabButtonActive]}
          onPress={() => setActiveTab('studio')}>
          <Text style={styles.tabIcon}>✨</Text>
          <Text style={[styles.tabText, activeTab === 'studio' && styles.tabTextActive]}>
            {t.tabStudio}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'market' && styles.tabButtonActive]}
          onPress={() => setActiveTab('market')}>
          <Text style={styles.tabIcon}>🛍️</Text>
          <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
            {t.tabMarket}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'institutional' && styles.tabButtonActive]}
          onPress={() => setActiveTab('institutional')}>
          <Text style={styles.tabIcon}>🏛️</Text>
          <Text style={[styles.tabText, activeTab === 'institutional' && styles.tabTextActive]}>{tx('bulkTab')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'account' && styles.tabButtonActive]}
          onPress={() => setActiveTab('account')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>{tx('accountTab')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Compliance Artifacts Preview Modal (GeM CSV & ONDC Beckn JSON) */}
      <Modal visible={complianceModalVisible} animationType="slide" transparent onRequestClose={() => setComplianceModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', padding: 20 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EA580C', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18, color: '#FFFFFF' }}>📜</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>Compliance Artifacts</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Government (GeM) & ONDC Schemas</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setComplianceModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#475569' }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Facilitator Notice */}
            <View style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#92400E', marginBottom: 2 }}>🤝 Cluster Coordinator Handoff Mode</Text>
              <Text style={{ fontSize: 10, color: '#78350F', lineHeight: 14 }}>
                Ready for upload by your local District Industries Centre (DIC) or SHG coordinator without manual data re-entry.
              </Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: complianceTab === 'gem' ? '#0F172A' : '#F1F5F9', alignItems: 'center' }}
                onPress={() => openComplianceModal('gem')}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: complianceTab === 'gem' ? '#FFFFFF' : '#475569' }}>📦 GeM CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: complianceTab === 'ondc' ? '#0F172A' : '#F1F5F9', alignItems: 'center' }}
                onPress={() => openComplianceModal('ondc')}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: complianceTab === 'ondc' ? '#FFFFFF' : '#475569' }}>⚡ ONDC Beckn</Text>
              </TouchableOpacity>
            </View>

            {/* Content Preview */}
            <ScrollView style={{ backgroundColor: '#0B0F19', borderRadius: 12, padding: 12, maxHeight: 260, marginBottom: 16 }}>
              {isComplianceLoading ? (
                <ActivityIndicator color="#EA580C" style={{ marginVertical: 40 }} />
              ) : complianceTab === 'gem' ? (
                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#A7F3D0', lineHeight: 16 }}>
                  {complianceCsvData || 'No items in catalog export yet.'}
                </Text>
              ) : (
                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#67E8F9', lineHeight: 16 }}>
                  {complianceJsonData ? JSON.stringify(complianceJsonData, null, 2) : 'No items in catalog payload yet.'}
                </Text>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                onPress={() => {
                  const payload = complianceTab === 'gem' ? complianceCsvData : JSON.stringify(complianceJsonData, null, 2);
                  const msg = `🤝 *KalaSetu ${complianceTab === 'gem' ? 'GeM Procurement Package' : 'ONDC Beckn 1.1.0 Payload'}*\n\nReady for cluster coordinator review:\n${payload.slice(0, 500)}...`;
                  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>📲 Send to Coordinator</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}
                onPress={() => {
                  const content = complianceTab === 'gem' ? complianceCsvData : JSON.stringify(complianceJsonData, null, 2);
                  Share.share({
                    title: complianceTab === 'gem' ? 'KalaSetu GeM Package' : 'KalaSetu ONDC Payload',
                    message: content,
                  });
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>📤 Share / Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Craft Picker Modal for Bulk Institutional Quotation */}
      <Modal visible={craftPickerModalVisible} animationType="slide" transparent onRequestClose={() => setCraftPickerModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>📦 Load from My Crafts</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Pick any craft to adapt into wholesale & bulk institutional quote</Text>
              </View>
              <TouchableOpacity onPress={() => setCraftPickerModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#475569' }}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {(publishedProducts.length > 0 ? publishedProducts : products).map(craft => (
                <TouchableOpacity
                  key={craft.id}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#F8FAFC', marginBottom: 8, borderColor: '#E2E8F0', borderWidth: 1 }}
                  onPress={() => loadCraftIntoBulk(craft)}
                >
                  <Image source={{ uri: craft.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200&q=80' }} style={{ width: 48, height: 48, borderRadius: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{craft.name}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>{craft.category} · Retail ₹{craft.price}</Text>
                  </View>
                  <View style={{ backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>Select ↗</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarSpacer: {
    width: '100%',
  },
  topStrip: {
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sihTag: {
    backgroundColor: '#F59E0B',
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topStripText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  langBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langBtnText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'android' ? 76 : 42,
    paddingRight: 12,
  },
  languageMenu: {
    width: 220,
    maxHeight: 520,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  languageMenuTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  languageMenuOption: {
    minHeight: 40,
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageMenuOptionActive: {
    backgroundColor: Colors.primaryLight,
  },
  languageMenuOptionText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  languageMenuOptionTextActive: {
    color: Colors.primaryDark,
  },
  languageCheck: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  appSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  helpBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  studioContainer: {
    padding: 16,
  },
  offlineDraftBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  offlineDraftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineDraftTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '900',
  },
  offlineDraftBadge: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },
  offlineDraftText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },
  offlineDraftSaveButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  offlineDraftSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  offlineDraftRow: {
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
    marginTop: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  offlineDraftInfo: {
    flex: 1,
  },
  offlineDraftName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  offlineDraftDate: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  offlineDraftActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  offlineDraftRestore: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  offlineDraftRemove: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '800',
  },
  homeContainer: {
    padding: 16,
  },
  homeHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  homeKicker: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  homeTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  homeSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  homeActionRow: {
    gap: 8,
  },
  homeImageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  homeImage: {
    width: '100%',
    height: 190,
    resizeMode: 'cover',
  } as ImageStyle,
  homeImageCaption: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    padding: 12,
  },
  homeSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  homeFeatureGrid: {
    gap: 10,
    marginBottom: 18,
  },
  homeFeatureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  homeFeatureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  homeFeatureTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  homeFeatureText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardStepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardStepSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  presetsRow: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  imageBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    resizeMode: 'cover',
  } as ImageStyle,
  removeImageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 10,
  },
  removeImageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  enhancedImage: {
    opacity: 0.96,
  } as ImageStyle,
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  enhancerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  enhancerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350F',
  },
  enhancerSub: {
    fontSize: 10,
    color: '#92400E',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  formFields: {
    gap: 10,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voiceButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  voiceButtonActive: {
    backgroundColor: '#FFEDD5',
    borderColor: Colors.primary,
  },
  voiceButtonText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  translateButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 5,
  },
  translateButtonText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  descriptionInputWrap: {
    position: 'relative',
  },
  descriptionInput: {
    paddingRight: 48,
  },
  descriptionMicButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  descriptionMicText: {
    fontSize: 16,
  },
  voiceLanguageRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  voiceLanguageChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  voiceLanguageChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: Colors.primary,
  },
  voiceLanguageChipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  voiceLanguageChipTextActive: {
    color: Colors.primary,
  },
  voiceHint: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 4,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  boldPriceInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricingBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  pricingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  pricingRange: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '800',
  },
  pricingJustification: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 8,
  },
  applyPriceBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  applyPriceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  tagChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
  },
  addTagBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addTagBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  descHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  speakerBtnText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  publishButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  marketContainer: {
    padding: 16,
  },
  bulkLeadCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  bulkLeadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A4D11',
    marginBottom: 4,
  },
  bulkLeadText: {
    fontSize: 11,
    color: '#7C2D12',
    lineHeight: 16,
    marginBottom: 8,
  },
  bulkLeadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  bulkLeadButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  institutionalHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  institutionalKicker: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  institutionalTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 8,
  },
  institutionalSubtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  stepLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },
  bulkHelpText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  bulkInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkHalfInput: {
    flex: 1,
  },
  bulkToolRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bulkPricingCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.background,
    padding: 12,
    marginBottom: 12,
  },
  bulkPricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  bulkPricingTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  bulkPricingBadge: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  bulkPricingHint: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 8,
  },
  bulkPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 9,
    gap: 6,
  },
  bulkPricingVolume: {
    flex: 1.2,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  bulkPricingPrice: {
    flex: 0.8,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
  },
  bulkPricingMargin: {
    flex: 1,
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  bulkPricingUnavailable: {
    color: Colors.textSecondary,
  },
  bulkToolButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
  },
  bulkToolText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  bulkChannelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  bulkChannelButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 11,
  },
  marketHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  marketHeroTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  marketHeroSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
  },
  marketHeroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  marketSpeakButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  marketSpeakButtonText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  guaranteeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  guaranteeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  deliveryInput: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  orderActionMessage: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '700',
    padding: 10,
    marginBottom: 12,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  quantityLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  quantityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quantityOption: {
    minWidth: 30,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quantityOptionText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  quantityOptionTextActive: {
    color: '#FFFFFF',
  },
  categoriesBar: {
    marginBottom: 14,
  },
  catChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  productsFeed: {
    gap: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  productImageWrapper: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as ImageStyle,
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FDE68A',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  productCardBody: {
    padding: 12,
  },
  productCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  productArtisan: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  productDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  reviewText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  reviewButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewButtonText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reviewEditor: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  reviewStar: {
    color: '#D1D5DB',
    fontSize: 24,
  },
  reviewStarActive: {
    color: '#D97706',
  },
  reviewInput: {
    minHeight: 60,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 8,
  },
  submitReviewButton: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  galleryThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inlineActionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  inlineActionButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  inlineActionButtonText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  whatsAppButton: {
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteProductButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteProductButtonText: {
    color: '#B91C1C',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  authSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  authFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 2,
  },
  authInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    marginBottom: 10,
  },
  authErrorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  authErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  authInfoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  authInfoText: {
    fontSize: 12,
    color: '#1E3A5F',
    lineHeight: 18,
  },
  demoPillsBox: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
  },
  demoPillsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  demoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  otpSentBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  otpSentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  otpSentSub: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 4,
    textAlign: 'center',
  },
  authToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  authToggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  authToggleActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  authToggleText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  authToggleTextActive: {
    color: Colors.primaryDark,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  roleChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  profileSummary: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  accountSubnav: {
    marginVertical: 16,
  },
  accountSubnavButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  accountSubnavButtonActive: {
    backgroundColor: Colors.primary,
  },
  accountSubnavText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  accountSubnavTextActive: {
    color: '#FFFFFF',
  },
  notificationCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 16,
  },
  notificationTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  notificationText: {
    color: '#1E40AF',
    fontSize: 11,
    marginBottom: 4,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adminStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  adminStatusButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  adminStatusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  adminStatusText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  adminStatusTextActive: {
    color: '#FFFFFF',
  },
  bulkRequestGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  bulkRequestColumn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  bulkRequestColumnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  bulkRequestList: {
    gap: 6,
  },
  bulkRequestItem: {
    fontSize: 11,
    color: Colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  secondaryAction: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryActionText: {
    color: Colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  supportButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  supportButtonText: {
    color: '#312E81',
    fontWeight: '700',
    fontSize: 11,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    zIndex: 20,
    elevation: 20,
  },
  bottomTabBarContent: {
    flexDirection: 'row',
    minWidth: '100%',
    height: 78,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  tabButton: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  orderSegmentBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSegmentBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  orderSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  orderSegmentTextActive: {
    color: '#FFFFFF',
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  orderBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  orderBadgeAccepted: {
    backgroundColor: '#DCFCE7',
  },
  orderBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  orderBadgeDispatched: {
    backgroundColor: '#E0E7FF',
  },
  orderStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  orderBadgeTextPending: {
    color: '#92400E',
  },
  orderBadgeTextAccepted: {
    color: '#166534',
  },
  orderBadgeTextRejected: {
    color: '#991B1B',
  },
  orderBadgeTextDispatched: {
    color: '#3730A3',
  },
  acceptOrderBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rejectOrderBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dispatchOrderBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
  },
  skipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
  iconBadge: {
    width: 116,
    height: 116,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(254, 215, 170, 0.4)',
  },
  iconGlyph: {
    fontSize: 66,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  bottomText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
