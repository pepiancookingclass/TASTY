export function SiteFooter() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          Built with ♡ for homemade delights. &copy; {new Date().getFullYear()} Tasty
        </p>
      </div>
    </footer>
  );
}
