import AboutUsSection from "@/components/home/AboutUsSection";
import BlogsSection from "@/components/home/BlogsSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import ImageBannerSection from "@/components/home/ImageBannerSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import ShopByCategorySection from "@/components/home/ShopByCategorySection";
import VideoBannerSection from "@/components/home/VideoBannerSection";

export default function Home() {
  return (
    <>
      <ImageBannerSection />
      <ShopByCategorySection />
      <AboutUsSection />
      <FeaturedProductsSection />
      <VideoBannerSection />
      <ReviewsSection />
      <BlogsSection />
    </>
  );
}
