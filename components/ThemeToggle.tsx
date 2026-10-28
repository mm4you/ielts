'use client';
import { MenuItem } from '@fluentui/react-components';
import { WeatherMoonRegular } from '@fluentui/react-icons/svg/weather-moon';
import { WeatherSunnyRegular } from '@fluentui/react-icons/svg/weather-sunny';
import { useAppTheme } from './FluentTheme';
export default function ThemeToggle() {
  const {dark,toggle} = useAppTheme();
  const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return <MenuItem icon={dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />} onClick={toggle}>{label}</MenuItem>;
}
