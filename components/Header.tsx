"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Avatar, Button, DrawerBody, DrawerHeader, DrawerHeaderTitle, Input, Menu, MenuItem, MenuItemLink, MenuList, MenuPopover, MenuTrigger, OverlayDrawer, Tooltip } from '@fluentui/react-components';
import { ArrowExitRegular } from '@fluentui/react-icons/svg/arrow-exit';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { ChevronDownRegular } from '@fluentui/react-icons/svg/chevron-down';
import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { HomeRegular } from '@fluentui/react-icons/svg/home';
import { LibraryRegular } from '@fluentui/react-icons/svg/library';
import { MicRegular } from '@fluentui/react-icons/svg/mic';
import { NavigationRegular } from '@fluentui/react-icons/svg/navigation';
import { PanelLeftContractRegular } from '@fluentui/react-icons/svg/panel-left-contract';
import { PanelLeftExpandRegular } from '@fluentui/react-icons/svg/panel-left-expand';
import { SearchRegular } from '@fluentui/react-icons/svg/search';
import { SettingsRegular } from '@fluentui/react-icons/svg/settings';
import { ChatHelpRegular } from '@fluentui/react-icons/svg/chat-help';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import { ChartMultipleRegular } from '@fluentui/react-icons/svg/chart-multiple';
import { FlashRegular } from '@fluentui/react-icons/svg/flash';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';
import { openFeedbackModal } from './FeedbackModal';

const studyLinks = [
  { href: '/', label: 'Tổng quan', icon: HomeRegular },
  { href: '/review', label: 'Ôn tập', icon: ArrowRepeatAllRegular },
  { href: '/library', label: 'Thư viện', icon: LibraryRegular },
  { href: '/collections', label: 'Bộ sưu tập', icon: BookOpenRegular },
  { href: '/analytics', label: 'Thống kê', icon: ChartMultipleRegular },
];
const gameLinks = [
  { href: '/speedrun', label: 'Tốc chiến', icon: FlashRegular },
  { href: '/match', label: 'Lật thẻ', icon: GamesRegular },
  { href: '/blockblast', label: 'Xếp hình', icon: GridRegular },
  { href: '/sniper', label: 'Thiện xạ', icon: TargetArrowRegular },
  { href: '/pronounce-challenge', label: 'Phát âm', icon: MicRegular },
];

export default function Header({ collapsed = false, onCollapse }: { collapsed?: boolean; onCollapse?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(() => gameLinks.slice(0, 4).some(item => pathname.startsWith(item.href)));
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  const current = [...studyLinks, ...gameLinks].find(item => item.href === '/' ? pathname === '/' : pathname.startsWith(item.href));
  const title = pathname.startsWith('/admin') ? 'Quản trị' : pathname.startsWith('/word/') ? 'Chi tiết từ vựng' : current?.label || 'IELTS Vocab';

  function navigation(compact: boolean, mobile = false) {
    const gamesId = mobile ? 'mobile-game-links' : 'desktop-game-links';
    function navLink({href,label,icon:Icon}: typeof studyLinks[number]) {
      const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
      const link = <Link href={href} className={`nav-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined} aria-label={compact ? label : undefined} onClick={() => setMobileOpen(false)}><Icon aria-hidden="true" />{!compact && <span>{label}</span>}</Link>;
      return compact ? <Tooltip key={href} content={label} relationship="label" positioning="after">{link}</Tooltip> : <div key={href}>{link}</div>;
    }
    return <>
      <Link href="/" className="app-brand" aria-label="IELTS Vocab, trang chủ" onClick={() => setMobileOpen(false)}>
        <BrandMark size={36} />
        {!compact && <span className="brand-name">IELTS Vocab</span>}
      </Link>
      <nav className="sidebar-navigation" aria-label="Điều hướng chính">
        <div className="nav-group"><p className={compact ? 'nav-section-label compact-label' : 'nav-section-label'}>{compact ? '·' : 'Học tập'}</p>{studyLinks.slice(0,4).map(navLink)}</div>
        <div className="nav-group"><p className={compact ? 'nav-section-label compact-label' : 'nav-section-label'}>{compact ? '·' : 'Luyện tập'}</p>
          {navLink({href:'/pronounce-challenge',label:'Phát âm',icon:MicRegular})}
          {compact ? <Menu positioning="after"><MenuTrigger disableButtonEnhancement><Button appearance="subtle" className="nav-link" icon={<GamesRegular />} aria-label="Trò chơi" /></MenuTrigger><MenuPopover><MenuList>{gameLinks.slice(0,4).map(({href,label,icon:Icon})=><MenuItemLink href={href} key={href} icon={<Icon />}>{label}</MenuItemLink>)}</MenuList></MenuPopover></Menu> : <><button className="nav-link" onClick={()=>setGamesOpen(value=>!value)} aria-expanded={gamesOpen} aria-controls={gamesId}><GamesRegular /><span>Trò chơi</span><ChevronDownRegular className={`nav-chevron ${gamesOpen?'is-open':''}`} /></button><div id={gamesId} className="nav-subgroup" hidden={!gamesOpen}>{gameLinks.slice(0,4).map(navLink)}</div></>}
        </div>
        <div className="nav-group">{navLink(studyLinks[4])}</div>
      </nav>
      <div className="sidebar-bottom">
        {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname.startsWith('/admin') ? 'is-active' : ''}`} aria-label={compact ? 'Trang Admin' : undefined}><SettingsRegular />{!compact && <span>Trang Admin</span>}</Link>}
        <button className="nav-link" onClick={() => { setMobileOpen(false); openFeedbackModal(); }} aria-label={compact ? 'Góp ý hệ thống' : undefined}><ChatHelpRegular />{!compact && <span>Góp ý hệ thống</span>}</button>
      </div>
    </>;
  }

  return <>
    <a className="skip-link" href="#main-content">Đến nội dung chính</a>
    <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>{navigation(collapsed)}</aside>
    <header className="app-topbar">
      <div className="topbar-leading">
        <Button className="desktop-nav-toggle" appearance="subtle" icon={collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-expanded={!collapsed} onClick={onCollapse} />
        <Button className="mobile-nav-toggle" appearance="subtle" icon={<NavigationRegular />} aria-label="Mở menu điều hướng" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} />
        <div className="topbar-location"><strong>{pathname.startsWith('/pronounce-challenge') ? 'Phát âm' : title}</strong></div>
      </div>
      <form action="/library" className="topbar-search" role="search">
        <Input name="search" aria-label="Tìm từ trong thư viện" placeholder="Tìm từ vựng trong thư viện" contentBefore={<SearchRegular />} appearance="filled-lighter" />
      </form>
      <div className="topbar-actions">
        <ThemeToggle />
        {session ? <Menu positioning="below-end">
          <MenuTrigger disableButtonEnhancement><Button appearance="transparent" className="profile-trigger" aria-label="Mở menu tài khoản"><Avatar name={session.user?.name || 'Bạn'} size={32} color="brand" /><span className="profile-name">{session.user?.name || 'Tài khoản'}</span></Button></MenuTrigger>
          <MenuPopover><div className="profile-summary"><strong>{session.user?.name}</strong><span>{session.user?.email}</span></div><MenuList>
            <MenuItem icon={<ChatHelpRegular />} onClick={() => openFeedbackModal()}>Góp ý hệ thống</MenuItem>
            <MenuItem icon={<ArrowExitRegular />} onClick={() => signOut({ callbackUrl: '/' })}>Đăng xuất</MenuItem>
          </MenuList></MenuPopover>
        </Menu> : <Button appearance="primary" onClick={() => signIn('google')}>Đăng nhập</Button>}
      </div>
    </header>
    <OverlayDrawer position="start" open={mobileOpen} onOpenChange={(_, data) => setMobileOpen(data.open)} size="small">
      <DrawerHeader><DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} aria-label="Đóng menu điều hướng" onClick={() => setMobileOpen(false)} />}>Điều hướng</DrawerHeaderTitle></DrawerHeader>
      <DrawerBody className="mobile-navigation">{navigation(false, true)}</DrawerBody>
    </OverlayDrawer>
    <nav className="mobile-bottom-nav" aria-label="Lối tắt học tập">
      {[studyLinks[0], studyLinks[1], studyLinks[2], studyLinks[3]].map(({href,label,icon:Icon}) => <Link href={href} key={href} aria-current={pathname === href ? 'page' : undefined} className={pathname === href ? 'is-active' : ''}><Icon /><span>{label}</span></Link>)}
      <button onClick={() => setMobileOpen(true)} aria-label="Xem tất cả chế độ"><NavigationRegular /><span>Thêm</span></button>
    </nav>
  </>;
}
