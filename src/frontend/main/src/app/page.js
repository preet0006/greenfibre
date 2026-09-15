import AboutUsSection from "@/components/home/AboutUsSection";
import BlogsSection from "@/components/home/BlogsSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import Hero3DSection from "@/components/home/Hero3DSection";
import ImageBannerSection from "@/components/home/ImageBannerSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import ShopByCategorySection from "@/components/home/ShopByCategorySection";
import VideoBannerSection from "@/components/home/VideoBannerSection";

export default function Home() {
  return (
    <>
      <Hero3DSection />
      <ShopByCategorySection />
      <AboutUsSection />
      <FeaturedProductsSection />
      <VideoBannerSection />
      <ReviewsSection />
      <BlogsSection />
    </>
  );
}
