from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time
import json
import os

download_directory = "D:/1/NN"  # Make sure the folder exists and is writable.
os.makedirs(download_directory, exist_ok=True)  # 确保目录存在

options = webdriver.EdgeOptions()
prefs = {
    "download.default_directory": download_directory,
    "download.prompt_for_download": False,
    "plugins.always_open_pdf_externally": True,
    "profile.default_content_settings.popups": 0,
    "safebrowsing.enabled": True,
    "download.open_pdf_in_system_reader": False,
    "printing.print_preview_sticky_settings.appState": json.dumps({
        "recentDestinations": [{"id": "Save as PDF", "origin": "local", "account": ""}],
        "selectedDestinationId": "Save as PDF",
        "version": 2,
        "isHeaderFooterEnabled": False
    })
}
options.add_experimental_option("prefs", prefs)
options.add_argument('--kiosk-printing')  # Enable silent printing
options.add_argument('--disable-blink-features=AutomationControlled')  # 避免被检测为自动化工具

driver = webdriver.Edge(options=options)
# 设置为正常用户代理
driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'})

login_url = "https://canvas.sussex.ac.uk/login"
driver.get(login_url)
time.sleep(3)  # 增加等待时间

username = WebDriverWait(driver, 15).until(
    EC.presence_of_element_located((By.ID, "input27"))
)
username.send_keys("xx206@sussex.ac.uk")

password = WebDriverWait(driver, 15).until(
    EC.presence_of_element_located((By.ID, "input35"))
)
password.send_keys("eakny3mp392q")

login_button = WebDriverWait(driver, 15).until(
    EC.element_to_be_clickable((By.CLASS_NAME, "button-primary"))
)
login_button.click()
print("Login button clicked successfully.")

time.sleep(7)  # 增加登录后等待时间

course_url = "https://canvas.sussex.ac.uk/courses/31835/modules"
driver.get(course_url)
time.sleep(5)  # 增加等待时间

# Collect all file links
file_links = WebDriverWait(driver, 15).until(
    EC.presence_of_all_elements_located((By.CSS_SELECTOR, "a.ig-title.title.item_link"))
)
all_hrefs = [link.get_attribute('href') for link in file_links]
print(f"找到 {len(all_hrefs)} 个链接")

# Visit each link and try to download or save as PDF
for index, href in enumerate(all_hrefs):
    print(f"访问第 {index+1}/{len(all_hrefs)} 个链接: {href}")
    driver.get(href)
    time.sleep(4)  # 增加页面加载时间
    page_title = driver.title  # Get the title for naming the PDF
    
    try:
        # 尝试多种选择器找到下载按钮
        download_buttons = []
        selectors = [
            "a[download]", 
            "a.file_download_btn", 
            "a.Button--primary", 
            "a.btn-primary", 
            "span.screenreader-only", 
            "button.al-trigger",
            ".module-item-title"
        ]
        
        for selector in selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                download_buttons.extend(elements)
                print(f"找到 {len(elements)} 个可能的下载按钮，使用选择器: {selector}")
        
        if download_buttons:
            for btn in download_buttons:
                try:
                    print(f"尝试点击按钮: {btn.text or btn.get_attribute('innerHTML')[:30]}")
                    # 使用JavaScript点击，更可靠
                    driver.execute_script("arguments[0].scrollIntoView(true);", btn)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", btn)
                    time.sleep(3)  # 等待下载开始
                except Exception as click_error:
                    print(f"点击按钮失败: {click_error}")
                    continue
            
            # 如果找到了下载按钮，等待更长时间确保下载完成
            time.sleep(5)
        else:
            # 尝试找下拉菜单中的下载选项
            try:
                menu_buttons = driver.find_elements(By.CSS_SELECTOR, ".al-trigger")
                if menu_buttons:
                    for menu in menu_buttons:
                        driver.execute_script("arguments[0].click();", menu)
                        time.sleep(1)
                        download_options = driver.find_elements(By.CSS_SELECTOR, ".ui-menu-item a")
                        for option in download_options:
                            if "download" in option.text.lower() or "下载" in option.text:
                                driver.execute_script("arguments[0].click();", option)
                                time.sleep(5)
                                break
            except Exception as menu_error:
                print(f"尝试菜单下载失败: {menu_error}")
            
            # 如果上述方法都失败，尝试保存为PDF
            print(f"没有找到下载按钮，保存页面为PDF: {page_title}")
            driver.execute_script("window.print();")
            time.sleep(3)
    except Exception as e:
        print(f"处理页面时出错: {e}")
        # 保存页面为PDF作为备用选项
        print(f"保存页面为PDF: {page_title}")
        driver.execute_script("window.print();")
        time.sleep(3)

print("所有链接处理完成")
driver.quit() 