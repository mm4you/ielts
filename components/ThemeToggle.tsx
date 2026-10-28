'use client';
import { Button } from '@fluentui/react-components';
import { WeatherMoonRegular } from '@fluentui/react-icons/svg/weather-moon';
import { WeatherSunnyRegular } from '@fluentui/react-icons/svg/weather-sunny';
import { useAppTheme } from './FluentTheme';
export default function ThemeToggle() {
  const {dark,toggle} = useAppTheme();
  const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return <Button className="theme-toggle" appearance="subtle" aria-label={label} title={label} icon={dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />} onClick={toggle} />;
}
