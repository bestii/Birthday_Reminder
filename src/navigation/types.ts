import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList>;
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Calendar: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  AddBirthday: undefined;
  AddEvent: undefined;
  ManageGroups: undefined;
  Settings: undefined;
  Notifications: undefined;
  Backup: undefined;
};

export type HomeDestination = Exclude<keyof HomeStackParamList, 'HomeMain'>;