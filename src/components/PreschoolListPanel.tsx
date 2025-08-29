import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapStore } from '@/stores/mapStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ChevronUp, MapPin, Star, Users, GraduationCap, Building2, Home, X, Phone, Clock, AlertTriangle, CheckCircle, MessageSquare, ChevronDown } from 'lucide-react';

interface PreschoolListPanelProps {
  className?: string;
}

const ITEMS_PER_PAGE = 6;
const MIN_VISIBLE_ITEMS = 6;

export const PreschoolListPanel: React.FC<PreschoolListPanelProps> = ({
  className
}) => {
  const {
    visiblePreschools,
    selectedPreschool,
    setSelectedPreschool,
    listContext,
    listSortOrder,
    setListSortOrder,
    mapZoom,
    hasActiveFilters,
    clearFilters
  } = useMapStore();

  const [displayedItems, setDisplayedItems] = useState(ITEMS_PER_PAGE);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset displayed items when visible preschools change
  useEffect(() => {
    setDisplayedItems(ITEMS_PER_PAGE);
  }, [visiblePreschools]);

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (displayedItems < visiblePreschools.length) {
        setDisplayedItems(prev => Math.min(prev + ITEMS_PER_PAGE, visiblePreschools.length));
      }
    }
  };

  const getContextTitle = () => {
    const count = visiblePreschools.length;
    const formattedCount = new Intl.NumberFormat('sv-SE').format(count);
    return `Antal förskolor: ${formattedCount} st.`;
  };
  
  const getContextSubtitle = () => {
    if (hasActiveFilters) return 'Matchade filter';
    if (mapZoom <= 6) return 'Visas i området';
    return 'Synliga på kartan';
  };

  const currentPreschools = visiblePreschools.slice(0, displayedItems);

  const handlePreschoolClick = (preschool: any) => {
    setSelectedPreschool(preschool);
  };

  if (!isExpanded) {
    return (
      <motion.div 
        initial={{ x: '100%', scale: 0.95 }} 
        animate={{ x: 0, scale: 1 }} 
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-8 right-8 z-50 ${className}`}
      >
        <Button 
          onClick={() => setIsExpanded(true)} 
          variant="secondary" 
          size="lg" 
          className="glass-search shadow-elegant px-6 py-4 hover-scale hover-glow-subtle transition-smooth font-heading rounded-xl"
        >
          <MapPin className="h-6 w-6 mr-3 text-primary" />
          <span className="text-lg font-semibold">{visiblePreschools.length}</span>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%', scale: 0.95 }} 
      animate={{ x: 0, scale: 1 }} 
      exit={{ x: '100%', scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-36 right-8 w-96 z-40 ${className}`} 
      style={{
        height: Math.max(MIN_VISIBLE_ITEMS * 72 + 160, 360) + 'px'
      }}
    >
      <Card className="h-full glass-search shadow-elegant border-0 hover-glow-subtle transition-smooth flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-200/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100">
                <MapPin className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-lg font-heading">{getContextTitle()}</h3>
                <p className="text-xs text-gray-600 font-medium">{getContextSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-md"
                >
                  <X className="h-3 w-3 mr-1" />
                  Rensa
                </Button>
              )}
              <Button 
                onClick={() => setIsExpanded(false)} 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-smooth"
              >
                <ChevronUp className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div ref={scrollContainerRef} className="h-full overflow-y-auto p-3 space-y-2 animate-fade-in" onScroll={handleScroll}>
            <AnimatePresence>
              {currentPreschools.map((preschool, index) => (
                <motion.div 
                  key={preschool.id} 
                  initial={{
                    opacity: 0,
                    y: 16
                  }} 
                  animate={{
                    opacity: 1,
                    y: 0
                  }} 
                  exit={{
                    opacity: 0,
                    y: -16
                  }} 
                  transition={{
                    delay: index * 0.04,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <PreschoolListItem 
                    preschool={preschool} 
                    isSelected={selectedPreschool?.id === preschool.id} 
                    onClick={() => handlePreschoolClick(preschool)} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {displayedItems < visiblePreschools.length && (
              <div className="text-center py-3 border-t border-gray-200/20 mt-4">
                <p className="text-xs text-gray-600 font-semibold">
                  Visar {displayedItems} av {visiblePreschools.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Scrolla för att se fler
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface PreschoolListItemProps {
  preschool: any;
  isSelected: boolean;
  onClick: () => void;
}

const PreschoolListItem: React.FC<PreschoolListItemProps> = ({
  preschool,
  isSelected,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);

  // Fetch Google data on mount if not already available
  useEffect(() => {
    if (preschool.google_rating || preschool.google_reviews_count || preschool.google_reviews || preschool.contact_phone) {
      setGoogleData({
        google_rating: preschool.google_rating,
        google_reviews_count: preschool.google_reviews_count,
        reviews: preschool.google_reviews,
        contact_phone: preschool.contact_phone,
        website_url: preschool.website_url,
        opening_hours: preschool.opening_hours
      });
    }
  }, [preschool]);

  const getHuvudmanInfo = (huvudman: string) => {
    switch (huvudman) {
      case 'Kommunal':
        return {
          icon: Building2,
          label: 'Kommunal',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'Enskild':
        return {
          icon: Home,
          label: 'Fristående',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          icon: Building2,
          label: 'Okänd',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getStaffDensityInfo = (density: number) => {
    if (density >= 0.15) return { icon: CheckCircle, color: 'text-green-600', label: 'Hög' };
    if (density >= 0.10) return { icon: AlertTriangle, color: 'text-yellow-600', label: 'Medel' };
    return { icon: AlertTriangle, color: 'text-red-600', label: 'Låg' };
  };

  const calculateGroupSize = () => {
    if (preschool.antal_barn && preschool.antal_barngrupper && preschool.antal_barngrupper > 0) {
      return Math.round(preschool.antal_barn / preschool.antal_barngrupper);
    }
    return null;
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<Star key={i} className="h-3 w-3 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-3 w-3 text-gray-300" />);
      }
    }
    return stars;
  };

  // Get huvudman information for display
  const huvudmanInfo = getHuvudmanInfo(preschool.huvudman);
  const HuvudmanIcon = huvudmanInfo.icon;
  const groupSize = calculateGroupSize();
  const staffDensity = preschool.personaltäthet;
  const staffDensityInfo = staffDensity ? getStaffDensityInfo(staffDensity) : null;
  const StaffIcon = staffDensityInfo?.icon;

  // Parse reviews if they exist
  const reviews = googleData?.reviews ? 
    (typeof googleData.reviews === 'string' ? JSON.parse(googleData.reviews) : googleData.reviews) : [];
  const hasReviews = reviews && Array.isArray(reviews) && reviews.length > 0;

  return (
    <TooltipProvider>
      <motion.div 
        whileHover={{ scale: 1.02, y: -3 }} 
        whileTap={{ scale: 0.98 }} 
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
          isSelected 
            ? 'border-primary bg-primary/5 shadow-md' 
            : 'border-gray-200/50 hover:border-gray-300 bg-white/50 hover:bg-white hover:shadow-md'
        }`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="space-y-3">
          {/* Header with name and rating */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-base leading-tight line-clamp-1 font-heading">
                {preschool.namn}
              </h4>
            </div>
            {googleData?.google_rating && (
              <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                <div className="flex items-center">
                  {renderStarRating(googleData.google_rating)}
                </div>
                <span className="text-xs font-bold text-gray-700 ml-1">
                  {googleData.google_rating.toFixed(1)}
                </span>
                {googleData.google_reviews_count && (
                  <span className="text-xs text-gray-500">({googleData.google_reviews_count})</span>
                )}
              </div>
            )}
          </div>
          
          {/* Location and type */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-600 min-w-0">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate font-medium">{preschool.kommun}</span>
            </div>
            
            {preschool.huvudman && (
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-1 h-6 flex items-center gap-1 font-medium rounded-md ${huvudmanInfo.bgColor} ${huvudmanInfo.color} ${huvudmanInfo.borderColor} flex-shrink-0`}
              >
                <HuvudmanIcon className="h-3 w-3" />
                <span>{huvudmanInfo.label}</span>
              </Badge>
            )}
          </div>
          
          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Staff density */}
            {staffDensity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    {StaffIcon && <StaffIcon className={`h-3 w-3 ${staffDensityInfo?.color}`} />}
                    <span className="text-xs font-medium text-gray-700">{staffDensity.toFixed(2)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Personaltäthet: {staffDensity.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Antal personal per barn</p>
                  <p className="text-xs text-gray-500">Högre värde = mer personal</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Children count */}
            {preschool.antal_barn && (
              <div className="flex items-center gap-1 p-2 bg-blue-50 rounded-md">
                <Users className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">{preschool.antal_barn}</span>
              </div>
            )}

            {/* Group size */}
            {groupSize && (
              <div className="flex items-center gap-1 p-2 bg-green-50 rounded-md">
                <span className="text-xs font-medium text-green-700">{groupSize}/grupp</span>
              </div>
            )}
          </div>

          {/* Teacher qualification with circular progress */}
          {preschool.andel_med_förskollärarexamen && (
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-md">
              <div className="flex items-center gap-2">
                <CircularProgress 
                  value={preschool.andel_med_förskollärarexamen} 
                  size={24}
                  strokeWidth={3}
                >
                  <GraduationCap className="h-2 w-2 text-gray-600" />
                </CircularProgress>
                <span className="text-xs font-medium text-purple-700">
                  Andel förskollärare: {Math.round(preschool.andel_med_förskollärarexamen)}%
                </span>
              </div>
            </div>
          )}

          {/* Expanded info on hover */}
          <AnimatePresence>
            {isHovered && googleData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 pt-2 space-y-1"
              >
                {googleData.contact_phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{googleData.contact_phone}</span>
                  </div>
                )}
                {googleData.opening_hours && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>Öppettider tillgängliga</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reviews section - only show if reviews exist */}
          {hasReviews && (
            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReviews(!showReviews);
                }}
                className="flex items-center justify-between w-full p-2 text-xs text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  <span>{reviews.length} recensioner</span>
                </div>
                <ChevronDown className={`h-3 w-3 transition-transform ${showReviews ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showReviews && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 space-y-2 max-h-48 overflow-y-auto"
                  >
                    {reviews.slice(0, 3).map((review: any, index: number) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs text-gray-700">{review.author_name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-2 w-2 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{review.text}</p>
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(review.time * 1000).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-1">
                        +{reviews.length - 3} fler recensioner
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};